import type { PageResponse } from "@/types/application/api/page-response";
import type { BlockedUser } from "@/types/application/network/blocked-user";
import type { ConnectionRequest } from "@/types/application/network/connection-request";
import type { ConnectionStatus } from "@/types/application/network/connection-status";
import type { ConnectionStatusResult } from "@/types/application/network/connection-status-result";
import type { MutedUser } from "@/types/application/network/muted-user";
import type { NetworkSummary } from "@/types/application/network/network-summary";
import type { NetworkUser } from "@/types/application/network/network-user";

import { api, buildQuery } from "../api-client";

export const networkApi = {
  list: (query?: string, cursor?: string | null, limit = 20) =>
    api.get<PageResponse<NetworkUser>>(`/network/users${buildQuery({ query, cursor, limit })}`),

  suggestions: (limit = 4) =>
    api.get<NetworkUser[]>(`/network/suggestions${buildQuery({ limit })}`),

  summary: () => api.get<NetworkSummary>("/network/summary"),

  requests: (cursor?: string | null, limit = 20) =>
    api.get<PageResponse<ConnectionRequest>>(`/network/requests${buildQuery({ cursor, limit })}`),

  connect: (targetUserId: string) =>
    api.post<ConnectionStatus>(`/network/connections/${targetUserId}`),

  accept: (targetUserId: string) =>
    api.put<ConnectionStatus>(`/network/connections/${targetUserId}/accept`),

  remove: (targetUserId: string) =>
    api.delete<ConnectionStatus>(`/network/connections/${targetUserId}`),

  status: (targetUserId: string) =>
    api.get<ConnectionStatusResult>(`/network/connections/${targetUserId}/status`),

  /** Bloqueia: a pessoa some do feed, dos comentários, das notificações e da busca. */
  block: (targetUserId: string) => api.post<{ status: string }>(`/network/blocks/${targetUserId}`),

  unblock: (targetUserId: string) =>
    api.delete<{ status: string }>(`/network/blocks/${targetUserId}`),

  blocked: () => api.get<BlockedUser[]>("/network/blocks"),

  /** Silencia: a pessoa some do feed, mensagens e notificações, sem saber. */
  mute: (targetUserId: string) => api.post<{ status: string }>(`/network/mutes/${targetUserId}`),

  unmute: (targetUserId: string) =>
    api.delete<{ status: string }>(`/network/mutes/${targetUserId}`),

  muted: () => api.get<MutedUser[]>("/network/mutes"),
};
