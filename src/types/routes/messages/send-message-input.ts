import type { Conversation } from "@/types/application/message/conversation";
import type { Message } from "@/types/application/message/message";

export type SendMessageInput = {
  conversationId: Conversation["id"];
  text: Message["text"];
  mediaIds: Message["mediaIds"];
  mediaSpoiler?: boolean;
  e2e?: { ciphertext: string; iv: string; encryptedKeys: Record<string, string> };
  replyToId?: string;
  /** Tópico aberto no momento do envio; a mensagem entra nele (sem tópico, na conversa). */
  topicId?: string | null;
};
