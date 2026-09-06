import { useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { networkApi, type NetworkUser } from "@/lib/api";
import { getConnectionUiState } from "@/utils/network";

import type { NetworkMatchItem } from "@/components/network/network-match-item";

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

  const matchItems: NetworkMatchItem[] = users.map((user) => ({
    user,
    state: getConnectionUiState(user.connected, connectionStatusByUserId[user.id]),
  }));

  return {
    matchItems,
    isPending: sendConnectionRequestMutation.isPending || removeConnectionMutation.isPending,
    acceptRequest: acceptConnectionRequestMutation.mutate,
    cancelRequest: removeConnectionMutation.mutate,
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
