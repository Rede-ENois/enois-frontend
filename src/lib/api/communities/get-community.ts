import type { Community } from "@/types/application/community/community";

import { apiRequest } from "@/lib/api-request";

export function getCommunity(communityId: string) {
  return apiRequest<Community>("GET", `/communities/${communityId}`);
}
