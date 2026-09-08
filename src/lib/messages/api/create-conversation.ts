import type { Conversation } from "@/types/messages/conversation";
import type { CreateConversationInput } from "@/types/messages/create-conversation-input";

import { apiRequest } from "@/lib/api-request";

export function createConversation(data: CreateConversationInput) {
  return apiRequest<Conversation>("POST", "/conversations", data, { idempotent: true });
}
