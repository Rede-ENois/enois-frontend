import { getCurrentUserId } from "@/lib/get-current-user-id";

import { createNetworkRequestsViewModel } from "@/utils/components/network/create-network-requests-view-model";
import { useNetworkRequestActions } from "@/utils/components/network/use-network-request-actions";
import { useNetworkRequestsQuery } from "@/utils/components/network/use-network-requests-query";

export function useNetworkRequestsController() {
  const requests = useNetworkRequestsQuery();
  const actions = useNetworkRequestActions();

  return {
    ...createNetworkRequestsViewModel(requests, getCurrentUserId()),
    acceptRequest: actions.accept,
    cancelRequest: actions.cancel,
  };
}
