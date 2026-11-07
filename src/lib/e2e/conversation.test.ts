// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  encryptForRecipient,
  encryptMessage,
  exportPrivateKey,
  exportPublicKey,
  exportSymmetricKey,
  generateConversationKey,
  generateKeypair,
} from "./crypto";

// --- Mocks ---
const batchPublicKeys = vi.fn();
const myConversationKey = vi.fn();
const getLocalPrivateKey = vi.fn();

vi.mock("@/lib/api/e2e", () => ({
  e2eApi: {
    batchPublicKeys: (...args: unknown[]) => batchPublicKeys(...args),
    myConversationKey: (...args: unknown[]) => myConversationKey(...args),
  },
}));

vi.mock("./key-manager", () => ({
  getLocalPrivateKey: () => getLocalPrivateKey(),
}));

describe("conversation e2e per-message", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("encryptForSend gera ciphertext + iv + encrypted keys por participante", async () => {
    const { encryptForSend } = await import("./conversation");

    const alice = await generateKeypair();
    const alicePub = await exportPublicKey(alice.publicKey);

    batchPublicKeys.mockResolvedValue({ user_alice: alicePub });

    const result = await encryptForSend("conv_1", "Ola!", ["user_alice"]);

    expect(result.ciphertext).toBeTruthy();
    expect(result.iv).toBeTruthy();
    expect(result.encryptedKeys).toHaveProperty("user_alice");
    expect(batchPublicKeys).toHaveBeenCalledWith(["user_alice"]);
  });

  it("encryptForSend lanca erro quando participante nao tem public key", async () => {
    const { encryptForSend } = await import("./conversation");

    batchPublicKeys.mockResolvedValue({}); // ninguem tem keypair

    await expect(encryptForSend("conv_1", "Ola!", ["user_sem_e2e"])).rejects.toThrow(
      "E2E indisponivel",
    );
  });

  it("decryptReceived decifra mensagem per-message corretamente", async () => {
    const { encryptForSend, decryptReceived } = await import("./conversation");

    const alice = await generateKeypair();
    const alicePub = await exportPublicKey(alice.publicKey);
    const alicePriv = await exportPrivateKey(alice.privateKey);

    batchPublicKeys.mockResolvedValue({ user_alice: alicePub });
    getLocalPrivateKey.mockResolvedValue(alicePriv);

    const encrypted = await encryptForSend("conv_1", "Mensagem secreta!", ["user_alice"]);

    const result = await decryptReceived(
      {
        id: "msg_1",
        conversationId: "conv_1",
        from: "user_bob",
        text: encrypted.ciphertext,
        mediaIds: [],
        time: "2026-11-05T00:00:00Z",
        e2e: true,
        iv: encrypted.iv,
        encryptedKeys: encrypted.encryptedKeys,
      },
      "user_alice",
    );

    expect(result).toBe("Mensagem secreta!");
  });

  it("decryptReceived faz fallback pra conversation key em mensagem antiga", async () => {
    const { decryptReceived } = await import("./conversation");

    const keypair = await generateKeypair();
    const privBase64 = await exportPrivateKey(keypair.privateKey);
    const convKey = await generateConversationKey();
    const convKeyBase64 = await exportSymmetricKey(convKey);
    const encryptedConvKey = await encryptForRecipient(convKeyBase64, keypair.publicKey);
    const { ciphertext, iv } = await encryptMessage("Mensagem antiga!", convKey);

    myConversationKey.mockResolvedValue({ encryptedKey: encryptedConvKey });
    getLocalPrivateKey.mockResolvedValue(privBase64);

    const result = await decryptReceived(
      {
        id: "msg_old",
        conversationId: "conv_old",
        from: "user_1",
        text: ciphertext,
        mediaIds: [],
        time: "2026-10-30T00:00:00Z",
        e2e: true,
        iv,
        // sem encryptedKeys = formato antigo
      },
      "user_me",
    );

    expect(result).toBe("Mensagem antiga!");
  });

  it("decryptReceived retorna fallback quando private key nao existe", async () => {
    const { decryptReceived } = await import("./conversation");

    getLocalPrivateKey.mockResolvedValue(null);

    const result = await decryptReceived(
      {
        id: "msg_1",
        conversationId: "conv_1",
        from: "user_1",
        text: "ciphertext",
        mediaIds: [],
        time: "2026-11-05T00:00:00Z",
        e2e: true,
        iv: "iv",
      },
      "user_me",
    );

    expect(result).toContain("configure o E2E");
  });

  it("decryptReceived retorna plaintext pra mensagem sem e2e", async () => {
    const { decryptReceived } = await import("./conversation");

    const result = await decryptReceived(
      {
        id: "msg_1",
        conversationId: "conv_1",
        from: "user_1",
        text: "texto normal",
        mediaIds: [],
        time: "2026-11-05T00:00:00Z",
        e2e: false,
        iv: null,
      },
      "user_me",
    );

    expect(result).toBe("texto normal");
  });
});
