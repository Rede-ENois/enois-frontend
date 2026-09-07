import type { PageResponse } from "@/types/application/api/page-response";
import type { Conversation } from "@/types/application/message/conversation";
import type { CreateConversationInput } from "@/types/application/message/create-conversation-input";
import type { Message } from "@/types/application/message/message";
import { buildQuery } from "@/utils/build-query";

import { apiRequest } from "../api-request";

export const messagesApi = {
  listConversations: (cursor?: string | null, limit = 20) => apiRequest<PageResponse<Conversation>>("GET", `/conversations${buildQuery({ cursor, limit })}`),
  createConversation: (data: CreateConversationInput) => apiRequest<Conversation>("POST", "/conversations", data, { idempotent: true }),
  getConversation: (conversationId: string) => apiRequest<Conversation>("GET", `/conversations/${conversationId}`),
  listMessages: (conversationId: string, cursor?: string | null, limit = 50) => apiRequest<PageResponse<Message>>("GET", `/conversations/${conversationId}/messages${buildQuery({ cursor, limit })}`),
  sendMessage: (conversationId: string, text: string) => apiRequest<Message>("POST", `/conversations/${conversationId}/messages`, { text }, { idempotent: true }),
  markAsRead: (conversationId: string) => apiRequest<void>("POST", `/conversations/${conversationId}/read`, undefined, { idempotent: true }),
  search: (q: string, limit = 20) => apiRequest<PageResponse<Conversation>>("GET", `/conversations/search${buildQuery({ q, limit })}`),
};
