import type { StatusResponse } from "@/types/application/api/status-response";

import { apiRequest } from "@/lib/api-request";

export function joinCommunity(communityId: string) {
  return apiRequest<StatusResponse>("POST", `/communities/${communityId}/members`, undefined, {
    idempotent: true,
  });
}
