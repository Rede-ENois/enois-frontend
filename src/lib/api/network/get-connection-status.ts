import type { ConnectionStatusResult } from "@/types/application/network/connection-status-result";

import { apiRequest } from "@/lib/api-request";

export function getConnectionStatus(targetUserId: string) {
  return apiRequest<ConnectionStatusResult>("GET", `/network/connections/${targetUserId}/status`);
}
