import type { ConnectionRequest } from "@/types/application/network/connection-request";

export function createNetworkRequestGroups(
  requests: ConnectionRequest[],
  currentUserId: string | null,
) {
  const pending = requests.filter((request) => request.status === "PENDING");
  const incoming = pending.filter((request) => request.fromUserId !== currentUserId);
  const outgoing = pending.filter((request) => request.fromUserId === currentUserId);

  return { incoming, outgoing };
}
