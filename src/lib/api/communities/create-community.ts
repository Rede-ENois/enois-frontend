import type { Community } from "@/types/application/community/community";
import type { CreateCommunityInput } from "@/types/application/community/create-community-input";

import { apiRequest } from "@/lib/api-request";

export function createCommunity(data: CreateCommunityInput) {
  return apiRequest<Community>("POST", "/communities", data, { idempotent: true });
}
