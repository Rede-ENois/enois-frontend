// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { encryptPrivateKey, exportPrivateKey, exportPublicKey, generateKeypair } from "./crypto";

// --- Mock IndexedDB with a simple in-memory store ---
const store = new Map<string, string>();

const fakeObjectStore = (mode: string) => ({
  put: (value: string, key: string) => {
    store.set(key, value);
    return { onsuccess: null, onerror: null };
  },
  get: (key: string) => {
    const result = store.get(key) ?? null;
    const req = { result, onsuccess: null as (() => void) | null, onerror: null };
    queueMicrotask(() => req.onsuccess?.());
    return req;
  },
  clear: () => {
    store.clear();
    return { onsuccess: null, onerror: null };
  },
});

const fakeTransaction = (mode: string) => {
  const tx = {
    objectStore: () => fakeObjectStore(mode),
    oncomplete: null as (() => void) | null,
    onerror: null,
  };
  queueMicrotask(() => tx.oncomplete?.());
  return tx;
};

const fakeDb = {
  transaction: (_store: string, mode = "readonly") => fakeTransaction(mode),
  close: vi.fn(),
  createObjectStore: vi.fn(),
};

vi.stubGlobal("indexedDB", {
  open: () => {
    const req = {
      result: fakeDb,
      onupgradeneeded: null as (() => void) | null,
      onsuccess: null as (() => void) | null,
      onerror: null,
    };
    queueMicrotask(() => req.onsuccess?.());
    return req;
  },
});

// --- Mock e2eApi ---
const uploadKeypair = vi.fn().mockResolvedValue({ id: "kp_1", status: "ACTIVE" });
const myKeypair = vi.fn();
const keypairHistory = vi.fn();

vi.mock("@/lib/api/e2e", () => ({
  e2eApi: {
    uploadKeypair: (...args: unknown[]) => uploadKeypair(...args),
    myKeypair: () => myKeypair(),
    keypairHistory: () => keypairHistory(),
  },
}));

// Estes testes fazem criptografia de verdade (RSA-2048 + PBKDF2 com 600 mil iterações por
// chamada), que custa segundos e varia com a máquina: o teto de 5s padrao vira vermelho falso.
const TEMPO_CRIPTO = 30_000;

describe("key-manager", () => {
  beforeEach(() => {
    store.clear();
    uploadKeypair.mockClear();
    myKeypair.mockClear();
    keypairHistory.mockClear();
  });

  it(
    "generateAndUpload stores keys locally and uploads to server",
    async () => {
      const { generateAndUpload, getLocalPrivateKey, getLocalPublicKey, hasLocalKeys } =
        await import("./key-manager");

      await generateAndUpload("senha123");

      expect(uploadKeypair).toHaveBeenCalledOnce();
      const [publicKey, encryptedPrivateKey, algorithm] = uploadKeypair.mock.calls[0];
      expect(publicKey).toBeTruthy();
      expect(encryptedPrivateKey).toBeTruthy();
      expect(algorithm).toBe("RSA-OAEP");

      expect(await hasLocalKeys()).toBe(true);
      expect(await getLocalPrivateKey()).toBeTruthy();
      expect(await getLocalPublicKey()).toBeTruthy();
    },
    TEMPO_CRIPTO,
  );

  it(
    "restoreFromBackup downloads and decrypts the keypair",
    async () => {
      const { restoreFromBackup, getLocalPrivateKey, getLocalPublicKey } =
        await import("./key-manager");

      // Prepare a real keypair on the "server"
      const keypair = await generateKeypair();
      const pubBase64 = await exportPublicKey(keypair.publicKey);
      const privBase64 = await exportPrivateKey(keypair.privateKey);
      const encrypted = await encryptPrivateKey(privBase64, "minha-senha");

      keypairHistory.mockResolvedValue([
        {
          id: "kp_1",
          publicKey: pubBase64,
          encryptedPrivateKey: encrypted,
          algorithm: "RSA-OAEP",
          active: true,
          createdAt: "2026-11-10T00:00:00Z",
        },
      ]);

      await restoreFromBackup("minha-senha");

      expect(await getLocalPrivateKey()).toBe(privBase64);
      expect(await getLocalPublicKey()).toBe(pubBase64);
    },
    TEMPO_CRIPTO,
  );

  it(
    "restoreFromBackup fails with wrong password",
    async () => {
      const { restoreFromBackup } = await import("./key-manager");

      const keypair = await generateKeypair();
      const pubBase64 = await exportPublicKey(keypair.publicKey);
      const privBase64 = await exportPrivateKey(keypair.privateKey);
      const encrypted = await encryptPrivateKey(privBase64, "senha-certa");

      keypairHistory.mockResolvedValue([
        {
          id: "kp_1",
          publicKey: pubBase64,
          encryptedPrivateKey: encrypted,
          algorithm: "RSA-OAEP",
          active: true,
          createdAt: "2026-11-10T00:00:00Z",
        },
      ]);

      await expect(restoreFromBackup("senha-errada")).rejects.toThrow();
    },
    TEMPO_CRIPTO,
  );

  it(
    "clearLocalKeys removes all keys from IndexedDB",
    async () => {
      const { generateAndUpload, clearLocalKeys, hasLocalKeys } = await import("./key-manager");

      await generateAndUpload("senha123");
      expect(await hasLocalKeys()).toBe(true);

      await clearLocalKeys();
      expect(await hasLocalKeys()).toBe(false);
    },
    TEMPO_CRIPTO,
  );

  it(
    "syncKeysOnLogin restores when local key differs from server",
    async () => {
      const { syncKeysOnLogin, getLocalPublicKey } = await import("./key-manager");

      // Generate a keypair and put a DIFFERENT key locally
      const keypair = await generateKeypair();
      const pubBase64 = await exportPublicKey(keypair.publicKey);
      const privBase64 = await exportPrivateKey(keypair.privateKey);
      const encrypted = await encryptPrivateKey(privBase64, "senha");

      store.set("my-public-key", "chave-local-diferente");
      store.set("my-private-key", "privada-local");

      myKeypair.mockResolvedValue({
        publicKey: pubBase64,
        encryptedPrivateKey: encrypted,
        algorithm: "RSA-OAEP",
      });
      keypairHistory.mockRejectedValue(new Error("sem histórico"));

      await syncKeysOnLogin("senha");

      // After sync, local public key should match server
      expect(await getLocalPublicKey()).toBe(pubBase64);
    },
    TEMPO_CRIPTO,
  );

  it(
    "syncKeysOnLogin skips when local key matches server",
    async () => {
      const { syncKeysOnLogin } = await import("./key-manager");

      const keypair = await generateKeypair();
      const pubBase64 = await exportPublicKey(keypair.publicKey);
      const privBase64 = await exportPrivateKey(keypair.privateKey);
      const encrypted = await encryptPrivateKey(privBase64, "senha");

      // Put the SAME key locally
      store.set("my-public-key", pubBase64);
      store.set("my-private-key", privBase64);

      myKeypair.mockResolvedValue({
        publicKey: pubBase64,
        encryptedPrivateKey: encrypted,
        algorithm: "RSA-OAEP",
      });

      await syncKeysOnLogin("senha");

      // myKeypair called but restoreFromBackup should NOT have been called
      // (no decrypt needed since keys match)
      expect(myKeypair).toHaveBeenCalledOnce();
    },
    TEMPO_CRIPTO,
  );

  it(
    "restoreFromBackup guarda também as privadas antigas do histórico do servidor",
    async () => {
      const { restoreFromBackup, getAllPrivateKeys, getLocalPrivateKey, getLocalPublicKey } =
        await import("./key-manager");

      // Duas gerações no servidor: a antiga já INATIVA e a atual ativa, ambas cifradas com a
      // mesma senha (é a senha da conta no generateAndUpload de cada geração).
      const senha = "senha-da-conta";
      const antigo = await generateKeypair();
      const atual = await generateKeypair();
      const antigoPub = await exportPublicKey(antigo.publicKey);
      const antigoPriv = await exportPrivateKey(antigo.privateKey);
      const atualPub = await exportPublicKey(atual.publicKey);
      const atualPriv = await exportPrivateKey(atual.privateKey);

      keypairHistory.mockResolvedValue([
        {
          id: "kp_2",
          publicKey: atualPub,
          encryptedPrivateKey: await encryptPrivateKey(atualPriv, senha),
          algorithm: "RSA-OAEP",
          active: true,
          createdAt: "2026-11-10T00:00:00Z",
        },
        {
          id: "kp_1",
          publicKey: antigoPub,
          encryptedPrivateKey: await encryptPrivateKey(antigoPriv, senha),
          algorithm: "RSA-OAEP",
          active: false,
          createdAt: "2026-10-01T00:00:00Z",
        },
      ]);

      await restoreFromBackup(senha);

      // O par ativo é o principal.
      expect(await getLocalPrivateKey()).toBe(atualPriv);
      expect(await getLocalPublicKey()).toBe(atualPub);
      // E a privada da geração antiga vem junto: é ela que abre as mensagens da época dela.
      const todas = await getAllPrivateKeys();
      expect(todas[0]).toBe(atualPriv);
      expect(todas).toContain(antigoPriv);
    },
    TEMPO_CRIPTO,
  );

  it(
    "restoreFromBackup segue funcionando quando o histórico não está disponível",
    async () => {
      const { restoreFromBackup, getAllPrivateKeys, getLocalPublicKey } =
        await import("./key-manager");

      const senha = "senha";
      const keypair = await generateKeypair();
      const pubBase64 = await exportPublicKey(keypair.publicKey);
      const privBase64 = await exportPrivateKey(keypair.privateKey);

      keypairHistory.mockRejectedValue(new Error("endpoint indisponível"));
      myKeypair.mockResolvedValue({
        publicKey: pubBase64,
        encryptedPrivateKey: await encryptPrivateKey(privBase64, senha),
        algorithm: "RSA-OAEP",
      });

      await restoreFromBackup(senha);

      expect(await getLocalPublicKey()).toBe(pubBase64);
      expect(await getAllPrivateKeys()).toEqual([privBase64]);
    },
    TEMPO_CRIPTO,
  );

  it(
    "restoreFromBackup não derruba a ativa quando a senha não abre uma geração antiga",
    async () => {
      const { restoreFromBackup, getLocalPrivateKey, getLocalPublicKey } =
        await import("./key-manager");

      // Ativa cifrada com a senha atual; antiga cifrada com a senha de ANTES da troca.
      const senhaAtual = "senha-atual";
      const antigo = await generateKeypair();
      const atual = await generateKeypair();
      const antigoPriv = await exportPrivateKey(antigo.privateKey);
      const atualPub = await exportPublicKey(atual.publicKey);
      const atualPriv = await exportPrivateKey(atual.privateKey);

      keypairHistory.mockResolvedValue([
        {
          id: "kp_2",
          publicKey: atualPub,
          encryptedPrivateKey: await encryptPrivateKey(atualPriv, senhaAtual),
          algorithm: "RSA-OAEP",
          active: true,
          createdAt: "2026-11-10T00:00:00Z",
        },
        {
          id: "kp_1",
          publicKey: await exportPublicKey(antigo.publicKey),
          encryptedPrivateKey: await encryptPrivateKey(antigoPriv, "senha-velha"),
          algorithm: "RSA-OAEP",
          active: false,
          createdAt: "2026-10-01T00:00:00Z",
        },
      ]);

      await restoreFromBackup(senhaAtual);

      expect(await getLocalPrivateKey()).toBe(atualPriv);
      expect(await getLocalPublicKey()).toBe(atualPub);
    },
    TEMPO_CRIPTO,
  );

  it(
    "generateAndUpload arquiva a chave anterior antes de substituir",
    async () => {
      const { generateAndUpload, getAllPrivateKeys } = await import("./key-manager");

      await generateAndUpload("primeira-senha");
      const privAntiga = store.get("my-private-key")!;

      await generateAndUpload("segunda-senha");

      // A rotação não pode matar a privada que abria as mensagens até agora.
      const todas = await getAllPrivateKeys();
      expect(todas).toContain(privAntiga);
      expect(todas[0]).not.toBe(privAntiga);
    },
    TEMPO_CRIPTO,
  );

  it(
    "isE2eReady reprova chave local que não é mais a ativa no servidor",
    async () => {
      const { isE2eReady } = await import("./key-manager");

      const keypair = await generateKeypair();
      store.set("my-public-key", await exportPublicKey(keypair.publicKey));
      store.set("my-private-key", await exportPrivateKey(keypair.privateKey));

      myKeypair.mockResolvedValue({
        publicKey: "chave-mais-nova-do-servidor",
        encryptedPrivateKey: "x",
        algorithm: "RSA-OAEP",
      });

      expect(await isE2eReady()).toBe(false);
    },
    TEMPO_CRIPTO,
  );

  it(
    "isE2eReady aprova quando a pública local é a ativa no servidor",
    async () => {
      const { isE2eReady } = await import("./key-manager");

      const keypair = await generateKeypair();
      const pubBase64 = await exportPublicKey(keypair.publicKey);
      store.set("my-public-key", pubBase64);
      store.set("my-private-key", await exportPrivateKey(keypair.privateKey));

      myKeypair.mockResolvedValue({
        publicKey: pubBase64,
        encryptedPrivateKey: "x",
        algorithm: "RSA-OAEP",
      });

      expect(await isE2eReady()).toBe(true);
    },
    TEMPO_CRIPTO,
  );
});
