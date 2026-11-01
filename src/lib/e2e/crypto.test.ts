// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  decryptMessage,
  decryptPrivateKey,
  decryptWithPrivateKey,
  encryptForRecipient,
  encryptMessage,
  encryptPrivateKey,
  exportPrivateKey,
  exportPublicKey,
  exportSymmetricKey,
  generateConversationKey,
  generateKeypair,
  importPrivateKey,
  importPublicKey,
  importSymmetricKey,
} from "./crypto";

describe("e2e crypto", () => {
  // --- Keypair ---

  it("generates a keypair and round-trips public key through export/import", async () => {
    const keypair = await generateKeypair();
    const pubBase64 = await exportPublicKey(keypair.publicKey);

    expect(pubBase64).toBeTruthy();
    expect(typeof pubBase64).toBe("string");

    const imported = await importPublicKey(pubBase64);
    expect(imported.algorithm).toMatchObject({ name: "RSA-OAEP" });
  });

  it("generates a keypair and round-trips private key through export/import", async () => {
    const keypair = await generateKeypair();
    const privBase64 = await exportPrivateKey(keypair.privateKey);

    expect(privBase64).toBeTruthy();

    const imported = await importPrivateKey(privBase64);
    expect(imported.algorithm).toMatchObject({ name: "RSA-OAEP" });
  });

  // --- Private key encryption with password ---

  it("encrypts private key with password and decrypts with the same password", async () => {
    const keypair = await generateKeypair();
    const privBase64 = await exportPrivateKey(keypair.privateKey);
    const password = "minha-senha-segura-123";

    const encrypted = await encryptPrivateKey(privBase64, password);
    expect(encrypted).not.toBe(privBase64);

    const decrypted = await decryptPrivateKey(encrypted, password);
    expect(decrypted).toBe(privBase64);
  });

  it("fails to decrypt private key with wrong password", async () => {
    const keypair = await generateKeypair();
    const privBase64 = await exportPrivateKey(keypair.privateKey);

    const encrypted = await encryptPrivateKey(privBase64, "senha-certa");

    await expect(decryptPrivateKey(encrypted, "senha-errada")).rejects.toThrow();
  });

  // --- Conversation key ---

  it("generates a conversation key and round-trips through export/import", async () => {
    const key = await generateConversationKey();
    const exported = await exportSymmetricKey(key);

    expect(exported).toBeTruthy();

    const imported = await importSymmetricKey(exported);
    expect(imported.algorithm).toMatchObject({ name: "AES-GCM" });

    // Re-export should match
    const reExported = await exportSymmetricKey(imported);
    expect(reExported).toBe(exported);
  });

  // --- RSA encrypt/decrypt (conversation key distribution) ---

  it("encrypts conversation key with public key and decrypts with private key", async () => {
    const keypair = await generateKeypair();
    const convKey = await generateConversationKey();
    const convKeyBase64 = await exportSymmetricKey(convKey);

    const encrypted = await encryptForRecipient(convKeyBase64, keypair.publicKey);
    expect(encrypted).not.toBe(convKeyBase64);

    const decrypted = await decryptWithPrivateKey(encrypted, keypair.privateKey);
    expect(decrypted).toBe(convKeyBase64);
  });

  it("fails to decrypt conversation key with a different private key", async () => {
    const keypair1 = await generateKeypair();
    const keypair2 = await generateKeypair();
    const convKey = await generateConversationKey();
    const convKeyBase64 = await exportSymmetricKey(convKey);

    const encrypted = await encryptForRecipient(convKeyBase64, keypair1.publicKey);

    await expect(decryptWithPrivateKey(encrypted, keypair2.privateKey)).rejects.toThrow();
  });

  // --- Message encrypt/decrypt ---

  it("encrypts and decrypts a message with the same conversation key", async () => {
    const key = await generateConversationKey();
    const plaintext = "Olá, tudo bem? Esta é uma mensagem de teste.";

    const { ciphertext, iv } = await encryptMessage(plaintext, key);

    expect(ciphertext).toBeTruthy();
    expect(iv).toBeTruthy();
    expect(ciphertext).not.toBe(plaintext);

    const decrypted = await decryptMessage(ciphertext, iv, key);
    expect(decrypted).toBe(plaintext);
  });

  it("encrypts and decrypts an empty message", async () => {
    const key = await generateConversationKey();

    const { ciphertext, iv } = await encryptMessage("", key);
    const decrypted = await decryptMessage(ciphertext, iv, key);

    expect(decrypted).toBe("");
  });

  it("encrypts and decrypts unicode/emoji content", async () => {
    const key = await generateConversationKey();
    const plaintext = "Mensagem com 🔥 emoji e acentuação: não, é, à, ção";

    const { ciphertext, iv } = await encryptMessage(plaintext, key);
    const decrypted = await decryptMessage(ciphertext, iv, key);

    expect(decrypted).toBe(plaintext);
  });

  it("fails to decrypt a message with a different conversation key", async () => {
    const key1 = await generateConversationKey();
    const key2 = await generateConversationKey();

    const { ciphertext, iv } = await encryptMessage("mensagem secreta", key1);

    await expect(decryptMessage(ciphertext, iv, key2)).rejects.toThrow();
  });

  it("fails to decrypt a message with a tampered ciphertext", async () => {
    const key = await generateConversationKey();
    const { ciphertext, iv } = await encryptMessage("mensagem original", key);

    // Tamper with ciphertext (flip a character)
    const tampered = ciphertext.slice(0, -2) + "AA";

    await expect(decryptMessage(tampered, iv, key)).rejects.toThrow();
  });

  it("produces different ciphertext for the same plaintext (random IV)", async () => {
    const key = await generateConversationKey();
    const plaintext = "mesma mensagem";

    const result1 = await encryptMessage(plaintext, key);
    const result2 = await encryptMessage(plaintext, key);

    expect(result1.ciphertext).not.toBe(result2.ciphertext);
    expect(result1.iv).not.toBe(result2.iv);

    // Both decrypt to the same value
    expect(await decryptMessage(result1.ciphertext, result1.iv, key)).toBe(plaintext);
    expect(await decryptMessage(result2.ciphertext, result2.iv, key)).toBe(plaintext);
  });

  // --- Full E2E flow ---

  it("simulates the full E2E flow: generate, distribute, encrypt, decrypt", async () => {
    // Alice and Bob each have a keypair
    const alice = await generateKeypair();
    const bob = await generateKeypair();

    // Alice creates a conversation key
    const convKey = await generateConversationKey();
    const convKeyBase64 = await exportSymmetricKey(convKey);

    // Alice distributes the key to Bob (encrypted with Bob's public key)
    const keyForBob = await encryptForRecipient(convKeyBase64, bob.publicKey);

    // Bob decrypts the conversation key with his private key
    const bobConvKeyBase64 = await decryptWithPrivateKey(keyForBob, bob.privateKey);
    const bobConvKey = await importSymmetricKey(bobConvKeyBase64);

    // Alice sends a message
    const { ciphertext, iv } = await encryptMessage("Oi Bob, tudo bem?", convKey);

    // Bob decrypts with his copy of the conversation key
    const decrypted = await decryptMessage(ciphertext, iv, bobConvKey);
    expect(decrypted).toBe("Oi Bob, tudo bem?");
  });
});
