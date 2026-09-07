import type { CommunityMembersResponse } from "@/types/application/community/community-members-response";

import { apiRequest } from "@/lib/api-request";

export function getCommunityMembers(communityId: string) {
  return apiRequest<CommunityMembersResponse>("GET", `/communities/${communityId}/members`);
}
