import type { ConnectionStatus } from "@/types/application/network/connection-status";

import { apiRequest } from "@/lib/api-request";

export function acceptConnection(targetUserId: string) {
  return apiRequest<ConnectionStatus>(
    "PUT",
    `/network/connections/${targetUserId}/accept`,
    undefined,
    { idempotent: true },
  );
}
