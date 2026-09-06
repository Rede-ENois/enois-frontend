import { api, buildQuery } from "../api-client";

export interface NetworkUser {
  id: string;
  username: string;
  name: string;
  headline: string;
  avatar: string | null;
  connections: number;
  followers: number;
  connected: boolean;
}

export interface PageResponse<T> {
  items: T[];
  nextCursor: string | null;
}

export interface NetworkSummary {
  userId: string;
  connections: number;
  followers: number;
  pendingRequests: number;
}

export interface ConnectionRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  createdAt: string;
}

export interface ConnectionStatus {
  id: string;
  status: string;
}

export interface ConnectionStatusDetails {
  targetUserId: string;
  status: "NONE" | "PENDING" | "ACCEPTED" | "REMOVED" | "BLOCKED";
}

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
