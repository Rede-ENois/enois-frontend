import { texts } from "@/texts";
import type { Message } from "@/types/application/message/message";

import { decryptReceived } from "./conversation";

async function readableText(
  message: Message,
  userId: string | null,
  hasKeys: boolean,
  decryptText: (message: Message, userId: string) => Promise<string>,
) {
  if (!message.e2e) return message.text;
  if (!userId || !hasKeys) return texts.messages.encryptedMessage;
  if (!message.iv) return texts.messages.messageDecryptError;
  try {
    return await decryptText(message, userId);
  } catch {
    return texts.messages.messageDecryptError;
  }
}

/** Mantém o ciphertext no transporte; o texto decifrado existe só no estado da tela. */
export async function decryptMessageBatch(
  messages: Message[],
  userId: string | null,
  hasKeys: boolean,
  decryptText: (message: Message, userId: string) => Promise<string> = decryptReceived,
) {
  const decrypted = await Promise.all(
    messages.map(async (message) => ({
      ...message,
      text: await readableText(message, userId, hasKeys, decryptText),
    })),
  );
  const originals = new Map(decrypted.map((message) => [message.id, message]));
  return Promise.all(
    decrypted.map(async (message) => {
      const reply = message.replyTo;
      if (!reply) return message;
      const original = originals.get(reply.id);
      if (original?.conversationId === message.conversationId) {
        return { ...message, replyTo: { ...reply, text: original.text } };
      }
      const text = await readableText(
        {
          id: reply.id,
          conversationId: message.conversationId,
          from: reply.from,
          text: reply.text,
          e2e: reply.e2e,
          iv: reply.iv,
          encryptedKeys: reply.encryptedKeys,
          mediaIds: [],
          time: message.time,
        },
        userId,
        hasKeys,
        decryptText,
      );
      return { ...message, replyTo: { ...reply, text } };
    }),
  );
}
