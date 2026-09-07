import type { PageResponse } from "@/types/application/api/page-response";
import type { StatusResponse } from "@/types/application/api/status-response";
import type { CommunityMembersResponse } from "@/types/application/community/community-members-response";
import type { CommunityTopic } from "@/types/application/community/community-topic";
import type { Community } from "@/types/application/community/community";
import type { CreateCommunityInput } from "@/types/application/community/create-community-input";
import type { PostView } from "@/types/application/feed/post-view";
import { buildQuery } from "@/utils/build-query";

import { apiRequest } from "../api-request";

export const communitiesApi = {
  list: (topic?: CommunityTopic, cursor?: string | null, limit = 20) => apiRequest<PageResponse<Community>>("GET", `/communities${buildQuery({ topic, cursor, limit })}`),
  get: (communityId: string) => apiRequest<Community>("GET", `/communities/${communityId}`),
  create: (data: CreateCommunityInput) => apiRequest<Community>("POST", "/communities", data, { idempotent: true }),
  update: (communityId: string, data: Partial<CreateCommunityInput>) => apiRequest<Community>("PATCH", `/communities/${communityId}`, data, { idempotent: true }),
  join: (communityId: string) => apiRequest<StatusResponse>("POST", `/communities/${communityId}/members`, undefined, { idempotent: true }),
  leave: (communityId: string) => apiRequest<StatusResponse>("DELETE", `/communities/${communityId}/members`, null, { idempotent: true }),
  getMembers: (communityId: string) => apiRequest<CommunityMembersResponse>("GET", `/communities/${communityId}/members`),
  getFeed: (communityId: string, cursor?: string | null, limit = 20) => apiRequest<PageResponse<PostView>>("GET", `/communities/${communityId}/feed${buildQuery({ cursor, limit })}`),
};
