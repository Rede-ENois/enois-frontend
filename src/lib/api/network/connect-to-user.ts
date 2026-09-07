import type { ConnectionStatus } from "@/types/application/network/connection-status";

import { apiRequest } from "@/lib/api-request";

export function connectToUser(targetUserId: string) {
  return apiRequest<ConnectionStatus>(
    "POST",
    `/network/connections/${targetUserId}`,
    undefined,
    { idempotent: true },
  );
}
