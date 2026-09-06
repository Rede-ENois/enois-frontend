import type { Conversation } from "@/types/application/message/conversation";
import type { CreateConversationInput } from "@/types/application/message/create-conversation-input";
import type { Message } from "@/types/application/message/message";
import type { PageResponse } from "@/types/application/pagination/page-response";

import { api, buildQuery } from "../api-client";

export type { Conversation } from "@/types/application/message/conversation";
export type { CreateConversationInput } from "@/types/application/message/create-conversation-input";
export type { Message } from "@/types/application/message/message";

export const messageApi = {
  listConversations: (cursor?: string | null, limit = 20) =>
    api.get<PageResponse<Conversation>>(`/conversations${buildQuery({ cursor, limit })}`),

  createConversation: (input: CreateConversationInput) =>
    api.post<Conversation>("/conversations", input),

  getConversation: (conversationId: string) =>
    api.get<Conversation>(`/conversations/${conversationId}`),

  listMessages: (conversationId: string, cursor?: string | null, limit = 50) =>
    api.get<PageResponse<Message>>(
      `/conversations/${conversationId}/messages${buildQuery({ cursor, limit })}`,
    ),

  sendMessage: (conversationId: string, text: string) =>
    api.post<Message>(`/conversations/${conversationId}/messages`, { text }),

  markConversationRead: (conversationId: string) =>
    api.post<void>(`/conversations/${conversationId}/read`),

  searchConversations: (query: string, limit = 20) =>
    api.get<PageResponse<Conversation>>(
      `/conversations/search${buildQuery({ q: query, limit })}`,
    ),
};
