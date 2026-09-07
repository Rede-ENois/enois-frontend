import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { listNetworkUsers } from "@/lib/api/network";
import { connectToUser } from "@/lib/api/network/connect-to-user";
import { removeConnection } from "@/lib/api/network/remove-connection";

export function useNetworkMatchesController() {
  const queryClient = useQueryClient();
  const [localStatus, setLocalStatus] = useState<Record<string, string>>({});
  const { data } = useQuery({
    queryKey: ["network", "users"],
    queryFn: () => listNetworkUsers(),
  });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["network"] });
  const connect = useMutation({ mutationFn: connectToUser, onSuccess: invalidate });
  const remove = useMutation({ mutationFn: removeConnection, onSuccess: invalidate });

  const toggleConnection = (userId: string, connected: boolean) => {
    if (connected) {
      remove.mutate(userId);
      setLocalStatus((status) => ({ ...status, [userId]: "REMOVED" }));
    } else {
      connect.mutate(userId);
      setLocalStatus((status) => ({ ...status, [userId]: "REQUESTED" }));
    }
  };

  return {
    users: data?.items ?? [],
    localStatus,
    pending: connect.isPending || remove.isPending,
    toggleConnection,
  };
}
