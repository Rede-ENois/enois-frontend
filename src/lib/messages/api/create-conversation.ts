import type { Conversation } from "@/types/application/message/conversation";
import type { CreateConversationInput } from "@/types/application/message/create-conversation-input";

import { apiRequest } from "@/lib/api-request";

export function createConversation(data: CreateConversationInput) {
  return apiRequest<Conversation>("POST", "/conversations", data, { idempotent: true });
}
