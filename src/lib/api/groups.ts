import type { PageResponse } from "@/types/application/api/page-response";
import type { StatusResponse } from "@/types/application/api/status-response";
import type { CreateGroupInput } from "@/types/application/group/create-group-input";
import type { GroupComment } from "@/types/application/group/group-comment";
import type { GroupMember } from "@/types/application/group/group-member";
import type { GroupPost } from "@/types/application/group/group-post";
import type { GroupRequest } from "@/types/application/group/group-request";
import type { GroupTopic } from "@/types/application/group/group-topic";
import type { GroupView } from "@/types/application/group/group-view";

import { api, buildQuery } from "../api-client";

/**
 * Grupos: espaços privados com feed próprio.
 *
 * A leitura da apresentação é pública; TUDO o que é interno (tópicos, publicações, membros,
 * pedidos) exige ser membro — e quem decide é o backend, não a tela.
 */
export const groupsApi = {
  list: (query?: string, cursor?: string | null, limit = 20) =>
    api.get<PageResponse<GroupView>>(`/groups${buildQuery({ query, cursor, limit })}`),

  /** Abre pelo slug (a página pública) ou pelo id (ações internas). */
  get: (slugOrId: string) => api.get<GroupView>(`/groups/${encodeURIComponent(slugOrId)}`),

  create: (data: CreateGroupInput) => api.post<GroupView>("/groups", data),

  update: (groupId: string, data: CreateGroupInput) =>
    api.patch<GroupView>(`/groups/${groupId}`, data),

  join: (groupId: string) => api.post<{ status: "MEMBER" | "PENDING" }>(`/groups/${groupId}/join`),

  leave: (groupId: string) => api.delete<StatusResponse>(`/groups/${groupId}/members/me`),

  members: (groupId: string) => api.get<PageResponse<GroupMember>>(`/groups/${groupId}/members`),

  removeMember: (groupId: string, userId: string) =>
    api.delete<StatusResponse>(`/groups/${groupId}/members/${userId}`),

  transfer: (groupId: string, userId: string) =>
    api.post<StatusResponse>(`/groups/${groupId}/transfer`, { userId }),

  requests: (groupId: string) => api.get<PageResponse<GroupRequest>>(`/groups/${groupId}/requests`),

  approve: (groupId: string, requestId: string) =>
    api.post<{ status: string }>(`/groups/${groupId}/requests/${requestId}/approve`),

  reject: (groupId: string, requestId: string) =>
    api.post<{ status: string }>(`/groups/${groupId}/requests/${requestId}/reject`),

  topics: (groupId: string) => api.get<PageResponse<GroupTopic>>(`/groups/${groupId}/topics`),

  createTopic: (groupId: string, data: { name: string; description?: string }) =>
    api.post<GroupTopic>(`/groups/${groupId}/topics`, data),

  updateTopic: (groupId: string, topicId: string, data: { name?: string; description?: string }) =>
    api.patch<GroupTopic>(`/groups/${groupId}/topics/${topicId}`, data),

  archiveTopic: (groupId: string, topicId: string) =>
    api.post<GroupTopic>(`/groups/${groupId}/topics/${topicId}/archive`),

  reorderTopics: (groupId: string, topicIds: string[]) =>
    api.post<PageResponse<GroupTopic>>(`/groups/${groupId}/topics/reorder`, { topicIds }),

  pinned: (groupId: string) => api.get<GroupPost>(`/groups/${groupId}/pinned`),

  pin: (groupId: string, postId: string) =>
    api.post<GroupPost>(`/groups/${groupId}/posts/${postId}/pin`),

  unpin: (groupId: string, postId: string) =>
    api.delete<StatusResponse>(`/groups/${groupId}/posts/${postId}/pin`),

  posts: (groupId: string, topicId?: string, cursor?: string | null, limit = 20) =>
    api.get<PageResponse<GroupPost>>(
      `/groups/${groupId}/posts${buildQuery({ topicId, cursor, limit })}`,
    ),

  publish: (groupId: string, data: { topicId: string; content: string; mediaIds?: string[] }) =>
    api.post<GroupPost>(`/groups/${groupId}/posts`, data),

  comments: (groupId: string, postId: string, limit = 100) =>
    api.get<PageResponse<GroupComment>>(
      `/groups/${groupId}/posts/${postId}/comments${buildQuery({ limit })}`,
    ),

  comment: (groupId: string, postId: string, data: { content: string; parentCommentId?: string }) =>
    api.post<GroupComment>(`/groups/${groupId}/posts/${postId}/comments`, data),

  /** Alterna a reação: mesma de novo remove, outra troca. */
  react: (groupId: string, postId: string, type: string) =>
    api.post<StatusResponse>(`/groups/${groupId}/posts/${postId}/reactions`, { type }),

  unreact: (groupId: string, postId: string) =>
    api.delete<StatusResponse>(`/groups/${groupId}/posts/${postId}/reactions`),

  /** O autor apaga o próprio; quem modera apaga o dos outros (o backend confere). */
  removePost: (groupId: string, postId: string) =>
    api.delete<StatusResponse>(`/groups/${groupId}/posts/${postId}`),

  editComment: (groupId: string, postId: string, commentId: string, data: { content: string }) =>
    api.patch<GroupComment>(`/groups/${groupId}/posts/${postId}/comments/${commentId}`, data),

  removeComment: (groupId: string, postId: string, commentId: string) =>
    api.delete<StatusResponse>(`/groups/${groupId}/posts/${postId}/comments/${commentId}`),

  /** Encerra o grupo (só o dono). */
  close: (groupId: string) => api.post<GroupView>(`/groups/${groupId}/close`),
};
