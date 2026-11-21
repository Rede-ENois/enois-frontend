import type { PageResponse } from "@/types/application/api/page-response";
import type { Conversation } from "@/types/application/message/conversation";
import type { CreateConversationInput } from "@/types/application/message/create-conversation-input";
import type { GroupParticipantView } from "@/types/application/message/group-panel";
import type { GroupPanelView } from "@/types/application/message/group-panel-view";
import type { GroupTopic } from "@/types/application/message/group-topic";
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

  /** `topicId` restringe a página ao tópico do grupo; sem ele, a conversa inteira. */
  listMessages: (
    conversationId: string,
    cursor?: string | null,
    limit = 50,
    topicId?: string | null,
  ) =>
    api.get<PageResponse<Message>>(
      `/conversations/${conversationId}/messages${buildQuery({ cursor, limit, topicId })}`,
    ),

  sendMessage: (
    conversationId: string,
    text: string,
    mediaIds: string[] = [],
    mediaSpoiler = false,
    e2e?: { ciphertext: string; iv: string; encryptedKeys: Record<string, string> },
    replyToId?: string,
    topicId?: string | null,
  ) =>
    api.post<Message>(`/conversations/${conversationId}/messages`, {
      text: e2e ? e2e.ciphertext : text,
      mediaIds,
      mediaSpoiler,
      ...(e2e ? { e2e: true, iv: e2e.iv, encryptedKeys: JSON.stringify(e2e.encryptedKeys) } : {}),
      ...(replyToId ? { replyToId } : {}),
      ...(topicId ? { topicId } : {}),
    }),

  // --- painel do grupo: quem participa, o papel de cada um e o que só o dono faz ---

  /** Papel e identidade de cada participante; `myRole` diz o que a pessoa pode fazer. */
  groupPanel: (conversationId: string) =>
    api.get<GroupPanelView>(`/conversations/${conversationId}/group/participants`),

  addParticipant: (conversationId: string, userId: string) =>
    api.post<GroupParticipantView>(`/conversations/${conversationId}/group/participants`, {
      userId,
    }),

  removeParticipant: (conversationId: string, userId: string) =>
    api.delete<{ status: string }>(`/conversations/${conversationId}/group/participants/${userId}`),

  /** Promove a administrador (`ADMIN`) ou volta a membro (`MEMBER`). Só o dono muda papel. */
  changeParticipantRole: (conversationId: string, userId: string, role: "ADMIN" | "MEMBER") =>
    api.patch<GroupParticipantView>(
      `/conversations/${conversationId}/group/participants/${userId}`,
      { role },
    ),

  /** Chave de cada mensagem antiga já cifrada para a chave pública da pessoa nova. */
  grantHistoryKeys: (conversationId: string, userId: string, keys: Record<string, string>) =>
    api.post<{ granted: number }>(
      `/conversations/${conversationId}/group/participants/${userId}/history-keys`,
      { keys },
    ),

  // --- tópicos dentro do grupo (criar, renomear, arquivar e ordenar é do dono/admin) ---

  listGroupTopics: (conversationId: string) =>
    api.get<PageResponse<GroupTopic>>(`/conversations/${conversationId}/group/topics`),

  createGroupTopic: (conversationId: string, name: string) =>
    api.post<GroupTopic>(`/conversations/${conversationId}/group/topics`, { name }),

  renameGroupTopic: (conversationId: string, topicId: string, name: string) =>
    api.patch<GroupTopic>(`/conversations/${conversationId}/group/topics/${topicId}`, { name }),

  archiveGroupTopic: (conversationId: string, topicId: string) =>
    api.post<GroupTopic>(`/conversations/${conversationId}/group/topics/${topicId}/archive`),

  /** A lista inteira numa nova ordem: precisa conter todos os tópicos, uma vez cada. */
  reorderGroupTopics: (conversationId: string, topicIds: string[]) =>
    api.post<PageResponse<GroupTopic>>(`/conversations/${conversationId}/group/topics/reorder`, {
      topicIds,
    }),

  /** Reage a uma mensagem (o backend alterna: mesmo emoji remove). */
  react: (conversationId: string, messageId: string, type: string) =>
    api.post<{ added: boolean }>(
      `/conversations/${conversationId}/messages/${messageId}/reactions`,
      { type },
    ),

  markAsRead: (conversationId: string) => api.post<void>(`/conversations/${conversationId}/read`),

  /** Heartbeat da conversa aberta na tela: enquanto vale, mensagens dela não notificam quem olha. */
  viewing: (conversationId: string) => api.post<void>(`/conversations/${conversationId}/viewing`),

  /** A conversa saiu da tela: as próximas mensagens voltam a notificar. */
  leftConversation: (conversationId: string) =>
    api.delete<void>(`/conversations/${conversationId}/viewing`),

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
