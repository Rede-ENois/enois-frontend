import type { PageResponse } from "@/types/application/api/page-response";
import type { Conversation } from "@/types/application/message/conversation";
import type { CreateConversationInput } from "@/types/application/message/create-conversation-input";
import type { Message } from "@/types/application/message/message";

import { api, buildQuery } from "../api-client";

export const messagesApi = {
  listConversations: (cursor?: string | null, limit = 20) =>
    api.get<PageResponse<Conversation>>(`/conversations${buildQuery({ cursor, limit })}`),

  createConversation: (data: CreateConversationInput) =>
    api.post<Conversation>("/conversations", data),

  /** Abre (ou reaproveita) a conversa direta com um usuario — botao "Mensagem" do perfil. */
  openDirect: (userId: string) => api.post<Conversation>("/conversations/direct", { userId }),

  getConversation: (conversationId: string) =>
    api.get<Conversation>(`/conversations/${conversationId}`),

  listMessages: (conversationId: string, cursor?: string | null, limit = 50) =>
    api.get<PageResponse<Message>>(
      `/conversations/${conversationId}/messages${buildQuery({ cursor, limit })}`,
    ),

  sendMessage: (
    conversationId: string,
    text: string,
    mediaIds: string[] = [],
    mediaSpoiler = false,
  ) =>
    api.post<Message>(`/conversations/${conversationId}/messages`, {
      text,
      mediaIds,
      mediaSpoiler,
    }),

  /** Reage a uma mensagem (o backend alterna: mesmo emoji remove). */
  react: (conversationId: string, messageId: string, type: string) =>
    api.post<{ added: boolean }>(
      `/conversations/${conversationId}/messages/${messageId}/reactions`,
      { type },
    ),

  markAsRead: (conversationId: string) => api.post<void>(`/conversations/${conversationId}/read`),

  /** "Apagar para mim" em massa: esconde as conversas só para quem chama. */
  hideConversations: (ids: string[]) =>
    api.post<{ hidden: number }>("/conversations/hide", { ids }),

  /** As arquivadas (apagadas só para quem chama) — a tela de restaurar. */
  archivedConversations: (cursor?: string | null, limit = 20) =>
    api.get<PageResponse<Conversation>>(`/conversations/archived${buildQuery({ cursor, limit })}`),

  /** "Apagar para mim" por mensagem (some só para quem apagou). */
  hideMessages: (conversationId: string, ids: string[]) =>
    api.post<{ hidden: number }>(`/conversations/${conversationId}/messages/hide`, { ids }),

  /** Restaurar: desfaz o "apagar para mim" das conversas escolhidas. */
  unhideConversations: (ids: string[]) =>
    api.post<{ restored: number }>("/conversations/unhide", { ids }),

  search: (q: string, limit = 20) =>
    api.get<PageResponse<Conversation>>(`/conversations/search${buildQuery({ q, limit })}`),
};
