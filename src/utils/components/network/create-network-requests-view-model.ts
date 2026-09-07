import { texts } from "@/texts";
import type { ConnectionRequest } from "@/types/application/network/connection-request";

import { createNetworkRequestGroups } from "@/utils/components/network/create-network-request-groups";

export function createNetworkRequestsViewModel(
  requests: ConnectionRequest[],
  currentUserId: string | null,
) {
  const { incoming, outgoing } = createNetworkRequestGroups(requests, currentUserId);
  const pendingCount = incoming.length + outgoing.length;

  return {
    incomingRequests: incoming,
    outgoingRequests: outgoing,
    hasRequests: pendingCount > 0,
    hasIncomingRequests: incoming.length > 0,
    hasOutgoingRequests: outgoing.length > 0,
    pendingLabel: texts.network.pendingCount(pendingCount),
    outgoingSectionClassName: incoming.length > 0 ? "pt-3" : "",
  };
}
