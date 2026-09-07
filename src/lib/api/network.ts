import type { PageResponse } from "@/types/application/api/page-response";
import type { ConnectionRequest } from "@/types/application/network/connection-request";
import type { ConnectionStatusResult } from "@/types/application/network/connection-status-result";
import type { ConnectionStatus } from "@/types/application/network/connection-status";
import type { NetworkSummary } from "@/types/application/network/network-summary";
import type { NetworkUser } from "@/types/application/network/network-user";
import { buildQuery } from "@/utils/build-query";

import { apiRequest } from "../api-request";

export const networkApi = {
  list: (query?: string, cursor?: string | null, limit = 20) => apiRequest<PageResponse<NetworkUser>>("GET", `/network/users${buildQuery({ query, cursor, limit })}`),
  suggestions: (limit = 4) => apiRequest<NetworkUser[]>("GET", `/network/suggestions${buildQuery({ limit })}`),
  summary: () => apiRequest<NetworkSummary>("GET", "/network/summary"),
  requests: (cursor?: string | null, limit = 20) => apiRequest<PageResponse<ConnectionRequest>>("GET", `/network/requests${buildQuery({ cursor, limit })}`),
  connect: (targetUserId: string) => apiRequest<ConnectionStatus>("POST", `/network/connections/${targetUserId}`, undefined, { idempotent: true }),
  accept: (targetUserId: string) => apiRequest<ConnectionStatus>("PUT", `/network/connections/${targetUserId}/accept`, undefined, { idempotent: true }),
  remove: (targetUserId: string) => apiRequest<ConnectionStatus>("DELETE", `/network/connections/${targetUserId}`, null, { idempotent: true }),
  status: (targetUserId: string) => apiRequest<ConnectionStatusResult>("GET", `/network/connections/${targetUserId}/status`),
};
