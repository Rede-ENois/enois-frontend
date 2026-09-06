import type { ConnectionRequest } from "@/types/application/network/connection-request";
import type { ConnectionStatus } from "@/types/application/network/connection-status";
import type { ConnectionStatusDetails } from "@/types/application/network/connection-status-details";
import type { NetworkSummary } from "@/types/application/network/network-summary";
import type { NetworkUser } from "@/types/application/network/network-user";
import type { PageResponse } from "@/types/application/pagination/page-response";

import { api, buildQuery } from "../api-client";

export type { ConnectionRequest } from "@/types/application/network/connection-request";
export type { ConnectionStatus } from "@/types/application/network/connection-status";
export type { ConnectionStatusDetails } from "@/types/application/network/connection-status-details";
export type { NetworkSummary } from "@/types/application/network/network-summary";
export type { NetworkUser } from "@/types/application/network/network-user";

export const networkApi = {
  listUsers: (query?: string, cursor?: string | null, limit = 20) =>
    api.get<PageResponse<NetworkUser>>(`/network/users${buildQuery({ query, cursor, limit })}`),

  listSuggestions: (limit = 4) =>
    api.get<NetworkUser[]>(`/network/suggestions${buildQuery({ limit })}`),

  getSummary: () => api.get<NetworkSummary>("/network/summary"),

  listRequests: (cursor?: string | null, limit = 20) =>
    api.get<PageResponse<ConnectionRequest>>(`/network/requests${buildQuery({ cursor, limit })}`),

  sendConnectionRequest: (targetUserId: string) =>
    api.post<ConnectionStatus>(`/network/connections/${targetUserId}`),

  acceptConnectionRequest: (targetUserId: string) =>
    api.put<ConnectionStatus>(`/network/connections/${targetUserId}/accept`),

  removeConnection: (targetUserId: string) =>
    api.delete<ConnectionStatus>(`/network/connections/${targetUserId}`),

  getConnectionStatus: (targetUserId: string) =>
    api.get<ConnectionStatusDetails>(`/network/connections/${targetUserId}/status`),
};
