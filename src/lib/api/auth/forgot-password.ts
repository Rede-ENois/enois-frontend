import type { StatusResponse } from "@/types/application/api/status-response";

import { apiRequest } from "@/lib/api-request";

export function forgotPassword(email: string) {
  return apiRequest<StatusResponse>(
    "POST",
    "/auth/password/forgot",
    { email },
    { idempotent: true },
  );
}
