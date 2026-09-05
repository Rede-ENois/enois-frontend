import { useQueries, useQuery } from "@tanstack/react-query";

import { networkApi, profileApi } from "@/lib/api";
import { useAuth } from "@/lib/use-auth";
import {
  getRequestDirection,
  getRequestTargetUserId,
  type RequestDirection,
} from "@/utils/network";

import type { NetworkRequestItem } from "@/components/network/network-request-item";

export function useNetworkData() {
  const { user: currentUser } = useAuth();
  const { data: usersData } = useQuery({
    queryKey: ["network", "users"],
    queryFn: () => networkApi.list(),
  });
  const { data: summary } = useQuery({
    queryKey: ["network", "summary"],
    queryFn: () => networkApi.summary(),
  });
  const { data: requestsData } = useQuery({
    queryKey: ["network", "requests"],
    queryFn: () => networkApi.requests(),
    refetchInterval: 30_000,
  });

  const users = usersData?.items ?? [];
  const currentUserId = currentUser?.id ?? "";
  const requestMeta = (requestsData?.items ?? [])
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
    queries: requestMeta.map(({ targetUserId }) => ({
      queryKey: ["profile", "by-id", targetUserId],
      queryFn: () => profileApi.getById(targetUserId),
      enabled: Boolean(targetUserId),
      staleTime: 60_000,
    })),
  });

  const requestGroups: Record<RequestDirection, NetworkRequestItem[]> = {
    incoming: [],
    outgoing: [],
  };
  requestMeta.forEach((item, index) => {
    requestGroups[item.direction].push({ ...item, user: requestProfileQueries[index]?.data });
  });

  return { users, summary, requestGroups };
}
