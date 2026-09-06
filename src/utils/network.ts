import type { ConnectionRequest } from "@/lib/api";
import type { ConnectionUiState } from "@/types/components/network/connection-ui-state";
import type { RequestDirection } from "@/types/components/network/request-direction";

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
