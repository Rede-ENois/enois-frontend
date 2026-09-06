import type { Conversation } from "@/types/application/message/conversation";
import type { Message } from "@/types/application/message/message";

export type SendMessageInput = {
  conversationId: Conversation["id"];
  text: Message["text"];
};
