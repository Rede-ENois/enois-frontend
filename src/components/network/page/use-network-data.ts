import { useQueries, useQuery } from "@tanstack/react-query";

import { networkApi, profileApi } from "@/lib/api";
import { useAuth } from "@/lib/use-auth";
import type { NetworkRequestViewModel, RequestDirection } from "@/types/components/network/network-request-view-model";
import {
  getRequestDirection,
  getRequestTargetUserId,
} from "@/utils/network";

export function useNetworkData() {
  const { user: currentUser } = useAuth();
  const { data: usersData } = useQuery({
    queryKey: ["network", "users"],
    queryFn: () => networkApi.listUsers(),
  });
  const { data: summary } = useQuery({
    queryKey: ["network", "summary"],
    queryFn: () => networkApi.getSummary(),
  });
  const { data: requestsData } = useQuery({
    queryKey: ["network", "requests"],
    queryFn: () => networkApi.listRequests(),
    refetchInterval: 30_000,
  });

  const users = usersData?.items ?? [];
  const currentUserId = currentUser?.id ?? "";
  const requestMetadata = (requestsData?.items ?? [])
    .filter((request) => request.status === "PENDING")
    .map((request) => {
      const direction = getRequestDirection(request, currentUserId);
      return {
        request,
        direction,
        targetUserId: getRequestTargetUserId(request, direction),
      };
    });

  const requestProfileQueries = useQueries({
    queries: requestMetadata.map(({ targetUserId }) => ({
      queryKey: ["profile", "by-id", targetUserId],
      queryFn: () => profileApi.getById(targetUserId),
      enabled: Boolean(targetUserId),
      staleTime: 60_000,
    })),
  });

  const requestsByDirection: Record<RequestDirection, NetworkRequestViewModel[]> = {
    incoming: [],
    outgoing: [],
  };
  requestMetadata.forEach((requestMetadataItem, index) => {
    requestsByDirection[requestMetadataItem.direction].push({
      ...requestMetadataItem,
      user: requestProfileQueries[index]?.data,
    });
  });

  return { users, summary, requestsByDirection };
}
