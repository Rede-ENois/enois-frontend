import type { ConnectionStatus } from "@/types/application/network/connection-status";

import { apiRequest } from "@/lib/api-request";

export function removeConnection(targetUserId: string) {
  return apiRequest<ConnectionStatus>(
    "DELETE",
    `/network/connections/${targetUserId}`,
    null,
    { idempotent: true },
  );
}
