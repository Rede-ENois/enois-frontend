import { useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { networkApi, type NetworkUser } from "@/lib/api";
import { getConnectionUiState } from "@/utils/network";

import type { NetworkMatchItem } from "@/components/network/network-match-item";

export function useNetworkActions(users: NetworkUser[]) {
  const queryClient = useQueryClient();
  const [localStatus, setLocalStatus] = useState<Record<string, string>>({});
  const invalidateNetwork = () => queryClient.invalidateQueries({ queryKey: ["network"] });

  const acceptRequest = useMutation({
    mutationFn: (id: string) => networkApi.accept(id),
    onSuccess: invalidateNetwork,
  });
  const connect = useMutation({
    mutationFn: (id: string) => networkApi.connect(id),
    onSuccess: invalidateNetwork,
  });
  const remove = useMutation({
    mutationFn: (id: string) => networkApi.remove(id),
    onSuccess: invalidateNetwork,
  });

  const matchItems: NetworkMatchItem[] = users.map((user) => ({
    user,
    state: getConnectionUiState(user.connected, localStatus[user.id]),
  }));

  return {
    matchItems,
    pending: connect.isPending || remove.isPending,
    acceptRequest: acceptRequest.mutate,
    cancelRequest: remove.mutate,
    connectUser: (userId: string) => {
      connect.mutate(userId);
      setLocalStatus((status) => ({ ...status, [userId]: "REQUESTED" }));
    },
    removeUser: (userId: string) => {
      remove.mutate(userId);
      setLocalStatus((status) => ({ ...status, [userId]: "REMOVED" }));
    },
  };
}
