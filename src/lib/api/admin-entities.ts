import type { AdminCommunityOverview } from "@/types/application/admin-entity/admin-community-overview";
import type { AdminEntityDeletion } from "@/types/application/admin-entity/admin-entity-deletion";
import type { AdminGroupOverview } from "@/types/application/admin-entity/admin-group-overview";
import type { AdminMemberPage } from "@/types/application/admin-entity/admin-member-page";
import type { AdminMemberRemoval } from "@/types/application/admin-entity/admin-member-removal";

import { api, buildQuery } from "../api-client";

/**
 * Gerenciamento de comunidades e grupos pela administração da plataforma.
 *
 * Tudo aqui mora em `/admin/moderation/**`, que o backend recusa para quem não é admin ANTES do
 * controller — inclusive chamada direta, com ou sem a tela. O front não decide permissão: mostra o
 * bloco só para quem `/moderation/me` diz que é admin, e trata 403 como falha real, não como estado
 * normal.
 */
export const adminEntitiesApi = {
  community: (communityId: string) =>
    api.get<AdminCommunityOverview>(
      `/admin/moderation/communities/${encodeURIComponent(communityId)}`,
    ),

  communityMembers: (communityId: string, query: string, page: number, size = 25) =>
    api.get<AdminMemberPage>(
      `/admin/moderation/communities/${encodeURIComponent(communityId)}/members${buildQuery({ q: query, page, size })}`,
    ),

  deleteCommunity: (communityId: string, reason: string) =>
    api.post<AdminEntityDeletion>(
      `/admin/moderation/communities/${encodeURIComponent(communityId)}/delete`,
      { reason },
    ),

  removeCommunityMember: (communityId: string, userId: string, reason: string) =>
    api.post<AdminMemberRemoval>(
      `/admin/moderation/communities/${encodeURIComponent(communityId)}/members/${encodeURIComponent(userId)}/remove`,
      { reason },
    ),

  group: (groupId: string) =>
    api.get<AdminGroupOverview>(`/admin/moderation/groups/${encodeURIComponent(groupId)}`),

  groupMembers: (groupId: string, query: string, page: number, size = 25) =>
    api.get<AdminMemberPage>(
      `/admin/moderation/groups/${encodeURIComponent(groupId)}/members${buildQuery({ q: query, page, size })}`,
    ),

  /** Exclusão FÍSICA: o conteúdo do grupo sai junto (tópicos, publicações e comentários). */
  deleteGroup: (groupId: string, reason: string) =>
    api.post<AdminEntityDeletion>(
      `/admin/moderation/groups/${encodeURIComponent(groupId)}/delete`,
      {
        reason,
      },
    ),

  /** Encerra preservando o histórico: sai da descoberta e não recebe gente nova. */
  closeGroup: (groupId: string, reason: string) =>
    api.post<AdminEntityDeletion>(`/admin/moderation/groups/${encodeURIComponent(groupId)}/close`, {
      reason,
    }),

  removeGroupMember: (groupId: string, userId: string, reason: string) =>
    api.post<AdminMemberRemoval>(
      `/admin/moderation/groups/${encodeURIComponent(groupId)}/members/${encodeURIComponent(userId)}/remove`,
      { reason },
    ),
};
