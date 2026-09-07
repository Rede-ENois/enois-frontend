import { useQuery } from "@tanstack/react-query";

import { texts } from "@/texts";

import { listConnectionRequests } from "@/lib/api/network/list-connection-requests";
import { getCurrentUserId } from "@/lib/get-current-user-id";

import { createNetworkRequestGroups } from "@/utils/components/network/create-network-request-groups";
import { useNetworkRequestActions } from "@/utils/components/network/use-network-request-actions";

export function useNetworkRequestsController() {
  const { data } = useQuery({
    queryKey: ["network", "requests"],
    queryFn: () => listConnectionRequests(),
    refetchInterval: 30_000,
  });
  const { incoming, outgoing } = createNetworkRequestGroups(data?.items ?? [], getCurrentUserId());
  const actions = useNetworkRequestActions();
  const pendingCount = incoming.length + outgoing.length;

  return {
    incomingRequests: incoming,
    outgoingRequests: outgoing,
    hasRequests: pendingCount > 0,
    hasIncomingRequests: incoming.length > 0,
    hasOutgoingRequests: outgoing.length > 0,
    pendingLabel: texts.network.pendingCount(pendingCount),
    outgoingSectionClassName: incoming.length > 0 ? "pt-3" : "",
    acceptRequest: actions.accept,
    cancelRequest: actions.cancel,
  };
}
