import { useState } from "react";

import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { type ConnectionRequest, networkApi, profileApi } from "@/lib/api";
import { requireAuth } from "@/lib/require-auth";
import { useAuth } from "@/lib/use-auth";
import { texts } from "@/texts";
import {
  getConnectionUiState,
  getRequestDirection,
  getRequestTargetUserId,
  type RequestDirection,
} from "@/utils/network";

import { AppContainer } from "@/components/app-container";
import {
  NetworkMatches,
  NetworkOverview,
  PendingRequests,
  type NetworkRequestItem,
} from "@/components/network/network-view";

export const Route = createFileRoute("/rede")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: texts.network.seoTitle }] }),
  component: NetworkRoute,
});

function NetworkRoute() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const [localStatus, setLocalStatus] = useState<Record<string, string>>({});

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
  const pendingRequests = (requestsData?.items ?? []).filter(
    (request) => request.status === "PENDING",
  );
  const currentUserId = currentUser?.id ?? "";
  const requestMeta = pendingRequests.map((request) => {
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
    requestGroups[item.direction].push({
      ...item,
      user: requestProfileQueries[index]?.data,
    });
  });

  const matchItems = users.map((user) => ({
    user,
    state: getConnectionUiState(user.connected, localStatus[user.id]),
  }));

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["network"] });

  const acceptRequest = useMutation({
    mutationFn: (id: string) => networkApi.accept(id),
    onSuccess: invalidate,
  });
  const connect = useMutation({
    mutationFn: (id: string) => networkApi.connect(id),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => networkApi.remove(id),
    onSuccess: invalidate,
  });

  const handleConnect = (userId: string) => {
    connect.mutate(userId);
    setLocalStatus((status) => ({ ...status, [userId]: "REQUESTED" }));
  };

  const handleRemove = (userId: string) => {
    remove.mutate(userId);
    setLocalStatus((status) => ({ ...status, [userId]: "REMOVED" }));
  };

  return (
    <AppContainer>
      <div className="space-y-6">
        <NetworkOverview summary={summary} suggestionsCount={users.length} />
        <PendingRequests
          incoming={requestGroups.incoming}
          outgoing={requestGroups.outgoing}
          onAccept={acceptRequest.mutate}
          onCancel={remove.mutate}
        />
        <NetworkMatches
          items={matchItems}
          pending={connect.isPending || remove.isPending}
          onConnect={handleConnect}
          onRemove={handleRemove}
        />
      </div>
    </AppContainer>
  );
}
