import type { StatusResponse } from "@/types/application/api/status-response";

import { apiRequest } from "@/lib/api-request";

export function leaveCommunity(communityId: string) {
  return apiRequest<StatusResponse>("DELETE", `/communities/${communityId}/members`, null, {
    idempotent: true,
  });
}
