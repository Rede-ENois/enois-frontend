// @vitest-environment node
import { texts } from "@/texts";
import type { Message } from "@/types/application/message/message";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { encryptForSend } from "./conversation";
import { exportPrivateKey, exportPublicKey, generateKeypair } from "./crypto";
import { decryptMessageBatch } from "./decrypt-message-batch";

const mocks = vi.hoisted(() => ({ publicKeys: vi.fn(), privateKey: vi.fn(), legacyKey: vi.fn() }));
vi.mock("@/lib/api/e2e", () => ({
  e2eApi: { batchPublicKeys: mocks.publicKeys, myConversationKey: mocks.legacyKey },
}));
vi.mock("./key-manager", () => ({
  getAllPrivateKeys: async () => {
    const key = await mocks.privateKey();
    return key ? [key] : [];
  },
}));
const message = (extra: Partial<Message> = {}): Message => ({
  id: "resposta",
  conversationId: "conversa-ficticia",
  from: "viewer",
  text: "Resposta fictícia",
  mediaIds: [],
  time: "2026-11-01T12:00:00Z",
  ...extra,
});

beforeEach(() => vi.resetAllMocks());

describe("decifra a citação privada com criptografia real", () => {
  it("usa ciphertext integral e chaves JSON da original fora da página", async () => {
    const pair = await generateKeypair();
    mocks.publicKeys.mockResolvedValue({ viewer: await exportPublicKey(pair.publicKey) });
    mocks.privateKey.mockResolvedValue(await exportPrivateKey(pair.privateKey));
    const originalText = "Conteúdo fictício privado. ".repeat(20);
    const encrypted = await encryptForSend("conversa-ficticia", originalText, ["viewer"]);
    const input = [
      message({
        text: "",
        mediaIds: ["midia-ficticia"],
        replyTo: {
          id: "original",
          from: "peer",
          text: encrypted.ciphertext,
          e2e: true,
          iv: encrypted.iv,
          encryptedKeys: JSON.stringify(encrypted.encryptedKeys),
        },
      }),
    ];
    const output = await decryptMessageBatch(input, "viewer", true);
    expect(output[0].replyTo?.text).toBe(originalText);
    expect(input[0].replyTo?.text).toBe(encrypted.ciphertext);
    expect(mocks.legacyKey).not.toHaveBeenCalled();
  });

  it.each([false, true])(
    "não mostra ciphertext sem identidade ou chave: hasKeys=%s",
    async (hasKeys) => {
      const output = await decryptMessageBatch(
        [
          message({
            e2e: true,
            text: "cipher-resposta",
            replyTo: {
              id: "original",
              from: "peer",
              text: "cipher-original",
              e2e: true,
              iv: "iv-ficticio",
            },
          }),
        ],
        hasKeys ? null : "viewer",
        hasKeys,
      );
      expect(output[0].text).toBe(texts.messages.encryptedMessage);
      expect(output[0].replyTo?.text).toBe(texts.messages.encryptedMessage);
      expect(mocks.privateKey).not.toHaveBeenCalled();
    },
  );

  it("reutiliza a original carregada sem expor preview E2E incompleto", async () => {
    const input = [
      message({ id: "original", text: "Texto original fictício" }),
      message({
        replyTo: { id: "original", from: "viewer", text: "cipher-incompleto", e2e: true },
      }),
    ];
    const output = await decryptMessageBatch(input, "viewer", true);
    expect(output[1].replyTo?.text).toBe("Texto original fictício");
  });

  it("indica metadados ausentes em vez de mostrar ciphertext", async () => {
    const output = await decryptMessageBatch(
      [
        message({
          replyTo: {
            id: "original",
            from: "peer",
            text: "cipher-incompleto",
            e2e: true,
          },
        }),
      ],
      "viewer",
      true,
    );
    expect(output[0].replyTo?.text).toBe(texts.messages.messageDecryptError);
  });

  it("isola metadados inválidos e preserva mensagens legadas de texto", async () => {
    mocks.privateKey.mockResolvedValue("chave-ficticia-invalida");
    const output = await decryptMessageBatch(
      [
        message({
          replyTo: {
            id: "original",
            from: "peer",
            text: "cipher-original",
            e2e: true,
            iv: "iv-ficticio",
            encryptedKeys: "{invalido",
          },
        }),
        message({
          id: "outra",
          replyTo: { id: "legada", from: "peer", text: "Texto legado fictício", e2e: false },
        }),
      ],
      "viewer",
      true,
    );
    expect(output[0].replyTo?.text).toBe(texts.messages.messageDecryptError);
    expect(output[1].replyTo?.text).toBe("Texto legado fictício");
  });
});
