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
const myConversationKey = vi.fn();
const userPublicKey = vi.fn();
const distributeConversationKey = vi.fn().mockResolvedValue({ status: "DISTRIBUTED" });
const getLocalPrivateKey = vi.fn();

vi.mock("@/lib/api/e2e", () => ({
  e2eApi: {
    myConversationKey: (...args: unknown[]) => myConversationKey(...args),
    userPublicKey: (...args: unknown[]) => userPublicKey(...args),
    distributeConversationKey: (...args: unknown[]) => distributeConversationKey(...args),
  },
}));

vi.mock("./key-manager", () => ({
  getLocalPrivateKey: () => getLocalPrivateKey(),
}));

describe("conversation e2e", () => {
  afterEach(async () => {
    vi.clearAllMocks();
    const { clearConversationKeyCache } = await import("./conversation");
    clearConversationKeyCache();
  });

  it("encryptForSend generates and distributes a new key when none exists", async () => {
    const { encryptForSend } = await import("./conversation");

    const alice = await generateKeypair();
    const alicePub = await exportPublicKey(alice.publicKey);
    const alicePriv = await exportPrivateKey(alice.privateKey);

    // No existing conversation key on server
    myConversationKey.mockResolvedValue({ encryptedKey: null });
    // Alice's public key returned for distribution
    userPublicKey.mockResolvedValue({ publicKey: alicePub });
    // Alice has local private key
    getLocalPrivateKey.mockResolvedValue(alicePriv);

    const result = await encryptForSend("conv_1", "Olá!", ["user_alice"]);

    expect(result.ciphertext).toBeTruthy();
    expect(result.iv).toBeTruthy();
    expect(distributeConversationKey).toHaveBeenCalledOnce();
    expect(distributeConversationKey.mock.calls[0][0]).toBe("conv_1");
  });

  it("encryptForSend reuses cached key on second call", async () => {
    const { encryptForSend } = await import("./conversation");

    const alice = await generateKeypair();
    const alicePub = await exportPublicKey(alice.publicKey);
    const alicePriv = await exportPrivateKey(alice.privateKey);

    myConversationKey.mockResolvedValue({ encryptedKey: null });
    userPublicKey.mockResolvedValue({ publicKey: alicePub });
    getLocalPrivateKey.mockResolvedValue(alicePriv);

    await encryptForSend("conv_2", "Primeira", ["user_alice"]);
    await encryptForSend("conv_2", "Segunda", ["user_alice"]);

    // Key created and distributed only once
    expect(distributeConversationKey).toHaveBeenCalledOnce();
    // myConversationKey called only once (second call uses cache)
    expect(myConversationKey).toHaveBeenCalledOnce();
  });

  it("decryptReceived returns plaintext for non-e2e messages", async () => {
    const { decryptReceived } = await import("./conversation");

    const result = await decryptReceived({
      id: "msg_1",
      conversationId: "conv_1",
      from: "user_1",
      text: "mensagem normal",
      mediaIds: [],
      time: "2026-10-30T00:00:00Z",
      e2e: false,
      iv: null,
    });

    expect(result).toBe("mensagem normal");
  });

  it("decryptReceived returns fallback when no conversation key exists", async () => {
    const { decryptReceived } = await import("./conversation");

    myConversationKey.mockResolvedValue({ encryptedKey: null });

    const result = await decryptReceived({
      id: "msg_1",
      conversationId: "conv_no_key",
      from: "user_1",
      text: "ciphertext_base64",
      mediaIds: [],
      time: "2026-10-30T00:00:00Z",
      e2e: true,
      iv: "iv_base64",
    });

    expect(result).toBe("[Mensagem cifrada — chave não disponível]");
  });

  it("decryptReceived returns fallback when no local private key", async () => {
    const { decryptReceived } = await import("./conversation");

    const convKey = await generateConversationKey();
    const convKeyBase64 = await exportSymmetricKey(convKey);

    myConversationKey.mockResolvedValue({ encryptedKey: convKeyBase64 });
    getLocalPrivateKey.mockResolvedValue(null);

    const result = await decryptReceived({
      id: "msg_1",
      conversationId: "conv_no_priv",
      from: "user_1",
      text: "ciphertext",
      mediaIds: [],
      time: "2026-10-30T00:00:00Z",
      e2e: true,
      iv: "iv",
    });

    expect(result).toBe("[Mensagem cifrada — configure o E2E]");
  });

  it("decryptReceived decrypts a real E2E message end-to-end", async () => {
    const { decryptReceived } = await import("./conversation");

    // Setup: generate keypair and conversation key
    const keypair = await generateKeypair();
    const privBase64 = await exportPrivateKey(keypair.privateKey);
    const convKey = await generateConversationKey();
    const convKeyBase64 = await exportSymmetricKey(convKey);

    // Encrypt the conversation key with the user's public key (as the server stores it)
    const encryptedConvKey = await encryptForRecipient(convKeyBase64, keypair.publicKey);

    // Encrypt a message with the conversation key
    const { ciphertext, iv } = await encryptMessage("Mensagem secreta!", convKey);

    // Mock: server returns the encrypted conversation key
    myConversationKey.mockResolvedValue({ encryptedKey: encryptedConvKey });
    getLocalPrivateKey.mockResolvedValue(privBase64);

    const result = await decryptReceived({
      id: "msg_real",
      conversationId: "conv_real",
      from: "user_1",
      text: ciphertext,
      mediaIds: [],
      time: "2026-10-30T00:00:00Z",
      e2e: true,
      iv,
    });

    expect(result).toBe("Mensagem secreta!");
  });

  it("clearConversationKeyCache clears the cache", async () => {
    const { encryptForSend, clearConversationKeyCache } = await import("./conversation");

    const alice = await generateKeypair();
    const alicePub = await exportPublicKey(alice.publicKey);
    const alicePriv = await exportPrivateKey(alice.privateKey);

    myConversationKey.mockResolvedValue({ encryptedKey: null });
    userPublicKey.mockResolvedValue({ publicKey: alicePub });
    getLocalPrivateKey.mockResolvedValue(alicePriv);

    await encryptForSend("conv_cache", "msg1", ["user_alice"]);
    expect(distributeConversationKey).toHaveBeenCalledOnce();

    clearConversationKeyCache();

    // After clearing, next call should create a new key
    await encryptForSend("conv_cache", "msg2", ["user_alice"]);
    expect(distributeConversationKey).toHaveBeenCalledTimes(2);
  });
});
