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

vi.mock("@/lib/api/e2e", () => ({
  e2eApi: {
    uploadKeypair: (...args: unknown[]) => uploadKeypair(...args),
    myKeypair: () => myKeypair(),
  },
}));

describe("key-manager", () => {
  beforeEach(() => {
    store.clear();
    uploadKeypair.mockClear();
    myKeypair.mockClear();
  });

  it("generateAndUpload stores keys locally and uploads to server", async () => {
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
  });

  it("restoreFromBackup downloads and decrypts the keypair", async () => {
    const { restoreFromBackup, getLocalPrivateKey, getLocalPublicKey } =
      await import("./key-manager");

    // Prepare a real keypair on the "server"
    const keypair = await generateKeypair();
    const pubBase64 = await exportPublicKey(keypair.publicKey);
    const privBase64 = await exportPrivateKey(keypair.privateKey);
    const encrypted = await encryptPrivateKey(privBase64, "minha-senha");

    myKeypair.mockResolvedValue({
      publicKey: pubBase64,
      encryptedPrivateKey: encrypted,
      algorithm: "RSA-OAEP",
    });

    await restoreFromBackup("minha-senha");

    expect(await getLocalPrivateKey()).toBe(privBase64);
    expect(await getLocalPublicKey()).toBe(pubBase64);
  });

  it("restoreFromBackup fails with wrong password", async () => {
    const { restoreFromBackup } = await import("./key-manager");

    const keypair = await generateKeypair();
    const pubBase64 = await exportPublicKey(keypair.publicKey);
    const privBase64 = await exportPrivateKey(keypair.privateKey);
    const encrypted = await encryptPrivateKey(privBase64, "senha-certa");

    myKeypair.mockResolvedValue({
      publicKey: pubBase64,
      encryptedPrivateKey: encrypted,
      algorithm: "RSA-OAEP",
    });

    await expect(restoreFromBackup("senha-errada")).rejects.toThrow();
  });

  it("clearLocalKeys removes all keys from IndexedDB", async () => {
    const { generateAndUpload, clearLocalKeys, hasLocalKeys } = await import("./key-manager");

    await generateAndUpload("senha123");
    expect(await hasLocalKeys()).toBe(true);

    await clearLocalKeys();
    expect(await hasLocalKeys()).toBe(false);
  });

  it("syncKeysOnLogin restores when local key differs from server", async () => {
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

    await syncKeysOnLogin("senha");

    // After sync, local public key should match server
    expect(await getLocalPublicKey()).toBe(pubBase64);
  });

  it("syncKeysOnLogin skips when local key matches server", async () => {
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
  });
});
