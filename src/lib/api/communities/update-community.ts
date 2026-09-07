import type { Community } from "@/types/application/community/community";
import type { CreateCommunityInput } from "@/types/application/community/create-community-input";

import { apiRequest } from "@/lib/api-request";

export function updateCommunity(communityId: string, data: Partial<CreateCommunityInput>) {
  return apiRequest<Community>("PATCH", `/communities/${communityId}`, data, {
    idempotent: true,
  });
}
