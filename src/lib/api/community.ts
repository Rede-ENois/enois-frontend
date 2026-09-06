import type { Community, CreateCommunityInput } from "@/types/application/community/community";
import type { CommunityMember } from "@/types/application/community/community-member";
import type { PostView } from "@/types/application/feed/post-view";
import type { PageResponse } from "@/types/application/pagination/page-response";

import { api, buildQuery } from "../api-client";

export type { Community, CreateCommunityInput } from "@/types/application/community/community";
export type { CommunityMember } from "@/types/application/community/community-member";

export const communityApi = {
  list: (topic?: string, cursor?: string | null, limit = 20) =>
    api.get<PageResponse<Community>>(`/communities${buildQuery({ topic, cursor, limit })}`),

  getById: (communityId: string) => api.get<Community>(`/communities/${communityId}`),

  create: (input: CreateCommunityInput) => api.post<Community>("/communities", input),

  update: (communityId: string, input: Partial<CreateCommunityInput>) =>
    api.patch<Community>(`/communities/${communityId}`, input),

  join: (communityId: string) =>
    api.post<{ status: string }>(`/communities/${communityId}/members`),

  leave: (communityId: string) =>
    api.delete<{ status: string }>(`/communities/${communityId}/members`),

  listMembers: (communityId: string) =>
    api.get<{ items: CommunityMember[] }>(`/communities/${communityId}/members`),

  listFeed: (communityId: string, cursor?: string | null, limit = 20) =>
    api.get<PageResponse<PostView>>(
      `/communities/${communityId}/feed${buildQuery({ cursor, limit })}`,
    ),
};
