import type { PageResponse } from "@/types/application/api/page-response";
import type { Conversation } from "@/types/application/message/conversation";
import type { CreateConversationInput } from "@/types/application/message/create-conversation-input";
import type { Message } from "@/types/application/message/message";
import type { InterfaceContext } from "@rede-enois/design-system/domain";

import { api, buildQuery } from "../api-client";

export const messagesApi = {
  /** `context` keeps only the social or the professional inbox (omitted = every conversation). */
  listConversations: (cursor?: string | null, limit = 20, context?: InterfaceContext) =>
    api.get<PageResponse<Conversation>>(`/conversations${buildQuery({ cursor, limit, context })}`),

  createConversation: (data: CreateConversationInput) =>
    api.post<Conversation>("/conversations", data),

  /** Abre (ou reaproveita) a conversa direta com um usuario — botao "Mensagem" do perfil. */
  openDirect: (userId: string) => api.post<Conversation>("/conversations/direct", { userId }),

  /** Abre (ou reaproveita) a DM corporativa — botao "Mensagem" do perfil profissional. */
  openBusinessDirect: (userId: string) =>
    api.post<Conversation>("/conversations/business-direct", { userId }),

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
    e2e?: { ciphertext: string; iv: string },
    replyToId?: string,
  ) =>
    api.post<Message>(`/conversations/${conversationId}/messages`, {
      text: e2e ? e2e.ciphertext : text,
      mediaIds,
      mediaSpoiler,
      ...(e2e ? { e2e: true, iv: e2e.iv } : {}),
      ...(replyToId ? { replyToId } : {}),
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
  archivedConversations: (cursor?: string | null, limit = 20, context?: InterfaceContext) =>
    api.get<PageResponse<Conversation>>(
      `/conversations/archived${buildQuery({ cursor, limit, context })}`,
    ),

  /** "Apagar para mim" por mensagem (some só para quem apagou). */
  hideMessages: (conversationId: string, ids: string[]) =>
    api.post<{ hidden: number }>(`/conversations/${conversationId}/messages/hide`, { ids }),

  /** Restaurar: desfaz o "apagar para mim" das conversas escolhidas. */
  unhideConversations: (ids: string[]) =>
    api.post<{ restored: number }>("/conversations/unhide", { ids }),

  search: (q: string, limit = 20) =>
    api.get<PageResponse<Conversation>>(`/conversations/search${buildQuery({ q, limit })}`),

  /** Mensagens nao lidas: de uma interface, ou de todas as conversas sem `context`. */
  unreadCount: (context?: InterfaceContext) =>
    api.get<{ count: number }>(`/conversations/unread-count${buildQuery({ context })}`),
};
