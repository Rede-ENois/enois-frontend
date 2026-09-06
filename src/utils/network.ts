import type { ConnectionRequest } from "@/lib/api";
import type { ConnectionUiState } from "@/types/components/network/network-match-view-model";
import type { RequestDirection } from "@/types/components/network/network-request-view-model";

export function getConnectionUiState(
  connected: boolean,
  localStatus: string | undefined,
): ConnectionUiState {
  if (connected) return "connected";
  if (localStatus === "REQUESTED") return "requested";
  return "available";
}

export function getRequestDirection(
  request: ConnectionRequest,
  currentUserId: string,
): RequestDirection {
  return request.fromUserId === currentUserId ? "outgoing" : "incoming";
}

export function getRequestTargetUserId(
  request: ConnectionRequest,
  direction: RequestDirection,
): string {
  return direction === "outgoing" ? request.toUserId : request.fromUserId;
}
