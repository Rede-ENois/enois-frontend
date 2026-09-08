import type { StatusResponse } from "@/types/application/api/status-response";

import { apiRequest } from "@/lib/api-request";

export function resetPassword(token: string, password: string) {
  return apiRequest<StatusResponse>(
    "POST",
    "/auth/password/reset",
    { token, password },
    { idempotent: true },
  );
}
