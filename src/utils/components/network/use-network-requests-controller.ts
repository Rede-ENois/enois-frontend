import { createNetworkRequestsViewModel } from "@/utils/components/network/create-network-requests-view-model";
import { useNetworkRequestsQuery } from "@/utils/components/network/use-network-requests-query";

import { getCurrentUserId } from "@/lib/get-current-user-id";

export function useNetworkRequestsController() {
  const requests = useNetworkRequestsQuery();

  return createNetworkRequestsViewModel(requests, getCurrentUserId());
}
