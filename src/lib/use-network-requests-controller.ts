import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { acceptConnection } from "@/lib/api/network/accept-connection";
import { listConnectionRequests } from "@/lib/api/network/list-connection-requests";
import { removeConnection } from "@/lib/api/network/remove-connection";
import { getCurrentUserId } from "@/lib/get-current-user-id";

export function useNetworkRequestsController() {
  const queryClient = useQueryClient();
  const currentUserId = getCurrentUserId();
  const { data } = useQuery({
    queryKey: ["network", "requests"],
    queryFn: () => listConnectionRequests(),
    refetchInterval: 30_000,
  });
  const pendingRequests = (data?.items ?? []).filter((request) => request.status === "PENDING");
  const incomingRequests = pendingRequests.filter(
    (request) => request.fromUserId !== currentUserId,
  );
  const outgoingRequests = pendingRequests.filter(
    (request) => request.fromUserId === currentUserId,
  );
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["network"] });
  const acceptRequest = useMutation({ mutationFn: acceptConnection, onSuccess: invalidate });
  const remove = useMutation({ mutationFn: removeConnection, onSuccess: invalidate });

  return {
    incomingRequests,
    outgoingRequests,
    acceptRequest: acceptRequest.mutate,
    cancelRequest: remove.mutate,
  };
}
