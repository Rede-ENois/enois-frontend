import { useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { networkApi, type NetworkUser } from "@/lib/api";
import type { NetworkMatchViewModel } from "@/types/components/network/network-match-view-model";
import { getConnectionUiState } from "@/utils/network";

export function useNetworkActions(users: NetworkUser[]) {
  const queryClient = useQueryClient();
  const [connectionStatusByUserId, setConnectionStatusByUserId] = useState<Record<string, string>>({});
  const invalidateNetwork = () => queryClient.invalidateQueries({ queryKey: ["network"] });

  const acceptConnectionRequestMutation = useMutation({
    mutationFn: (targetUserId: string) => networkApi.acceptConnectionRequest(targetUserId),
    onSuccess: invalidateNetwork,
  });
  const sendConnectionRequestMutation = useMutation({
    mutationFn: (targetUserId: string) => networkApi.sendConnectionRequest(targetUserId),
    onSuccess: invalidateNetwork,
  });
  const removeConnectionMutation = useMutation({
    mutationFn: (targetUserId: string) => networkApi.removeConnection(targetUserId),
    onSuccess: invalidateNetwork,
  });

  const matches: NetworkMatchViewModel[] = users.map((user) => ({
    user,
    connectionState: getConnectionUiState(user.connected, connectionStatusByUserId[user.id]),
  }));

  return {
    matches,
    isConnectionActionPending:
      sendConnectionRequestMutation.isPending || removeConnectionMutation.isPending,
    acceptConnectionRequest: acceptConnectionRequestMutation.mutate,
    cancelConnectionRequest: removeConnectionMutation.mutate,
    connectUser: (userId: string) => {
      sendConnectionRequestMutation.mutate(userId);
      setConnectionStatusByUserId((currentStatus) => ({ ...currentStatus, [userId]: "REQUESTED" }));
    },
    removeUser: (userId: string) => {
      removeConnectionMutation.mutate(userId);
      setConnectionStatusByUserId((currentStatus) => ({ ...currentStatus, [userId]: "REMOVED" }));
    },
  };
}
