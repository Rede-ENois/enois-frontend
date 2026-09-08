import type { Conversation } from "@/types/messages/conversation";
import type { Message } from "@/types/messages/message";

export type SendMessageInput = {
  conversationId: Conversation["id"];
  text: Message["text"];
};
