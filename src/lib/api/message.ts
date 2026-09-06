import { api, buildQuery } from "../api-client";

export interface Conversation {
  id: string;
  kind: "DIRECT" | "GROUP";
  title: string | null;
  participantIds: string[];
  lastMessage: string | null;
  time: string | null;
  unread: number;
}

export interface Message {
  id: string;
  from: string;
  text: string;
  time: string;
}

export interface PageResponse<T> {
  items: T[];
  nextCursor: string | null;
}

export interface CreateConversationInput {
  kind: "DIRECT" | "GROUP";
  title?: string | null;
  participantIds: string[];
}

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
