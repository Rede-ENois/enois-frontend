import type { PageResponse } from "@/types/application/api/page-response";
import type { StatusResponse } from "@/types/application/api/status-response";
import type { Community } from "@/types/application/community/community";
import type { CommunityChannel } from "@/types/application/community/community-channel";
import type { CommunityListParams } from "@/types/application/community/community-list-params";
import type { CommunityMembersResponse } from "@/types/application/community/community-members-response";
import type { CreateCommunityChannelInput } from "@/types/application/community/create-community-channel-input";
import type { CreateCommunityInput } from "@/types/application/community/create-community-input";
import type { PostView } from "@/types/application/feed/post-view";

import { api, buildQuery } from "../api-client";

export const communitiesApi = {
  /** Vitrine. `state` sozinho filtra a UF; `city` só vale junto com `state`. */
  list: ({ topic, cursor, limit = 20, q, city, state }: CommunityListParams = {}) =>
    api.get<PageResponse<Community>>(
      `/communities${buildQuery({ topic, cursor, limit, q, city, state })}`,
    ),

  /** "Perto de você": cidade do próprio perfil primeiro, depois o resto da UF (pede sessão). */
  local: (limit = 20) =>
    api.get<PageResponse<Community>>(`/communities/local${buildQuery({ limit })}`),

  get: (communityId: string) => api.get<Community>(`/communities/${communityId}`),

  create: (data: CreateCommunityInput) => api.post<Community>("/communities", data),

  update: (communityId: string, data: Partial<CreateCommunityInput>) =>
    api.patch<Community>(`/communities/${communityId}`, data),

  pinned: (communityId: string) => api.get<PostView>(`/communities/${communityId}/pin`),

  pin: (communityId: string, postId: string) =>
    api.post<PostView>(`/communities/${communityId}/pin`, { postId }),

  unpin: (communityId: string) => api.delete<StatusResponse>(`/communities/${communityId}/pin`),

  /** Canais privados: a API responde 403 para quem não participa da comunidade. */
  channels: (communityId: string) =>
    api.get<CommunityChannel[]>(`/communities/${communityId}/channels`),

  createChannel: (communityId: string, data: CreateCommunityChannelInput) =>
    api.post<CommunityChannel>(`/communities/${communityId}/channels`, data),

  channelPosts: (communityId: string, channelId: string, cursor?: string | null, limit = 20) =>
    api.get<PageResponse<PostView>>(
      `/communities/${communityId}/channels/${channelId}/posts${buildQuery({ cursor, limit })}`,
    ),

  join: (communityId: string) => api.post<StatusResponse>(`/communities/${communityId}/members`),

  leave: (communityId: string) => api.delete<StatusResponse>(`/communities/${communityId}/members`),

  /** Comunidades favoritadas (bookmark) pelo usuário. */
  favorites: (limit = 50) =>
    api.get<PageResponse<Community>>(`/communities/favorites${buildQuery({ limit })}`),

  favorite: (communityId: string) =>
    api.post<StatusResponse>(`/communities/${communityId}/favorite`),

  unfavorite: (communityId: string) =>
    api.delete<StatusResponse>(`/communities/${communityId}/favorite`),

  /** Comunidades das quais o usuário participa (menu lateral). */
  mine: (limit = 20) =>
    api.get<PageResponse<Community>>(`/communities/mine${buildQuery({ limit })}`),

  /** Transfere a administração para outro membro (só o dono atual). */
  transfer: (communityId: string, newOwnerId: string) =>
    api.post<Community>(`/communities/${communityId}/transfer`, { newOwnerId }),

  /** Exclui a comunidade (só o dono). */
  remove: (communityId: string) => api.delete<StatusResponse>(`/communities/${communityId}`),

  getMembers: (communityId: string) =>
    api.get<CommunityMembersResponse>(`/communities/${communityId}/members`),

  getFeed: (communityId: string, cursor?: string | null, limit = 20) =>
    api.get<PageResponse<PostView>>(
      `/communities/${communityId}/feed${buildQuery({ cursor, limit })}`,
    ),
};
