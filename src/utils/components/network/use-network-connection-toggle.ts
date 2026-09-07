import { useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { connectToUser } from "@/lib/api/network/connect-to-user";
import { removeConnection } from "@/lib/api/network/remove-connection";

export function useNetworkConnectionToggle() {
  const queryClient = useQueryClient();
  const [localStatus, setLocalStatus] = useState<Record<string, string>>({});
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["network"] });
  const connect = useMutation({ mutationFn: connectToUser, onSuccess: invalidate });
  const remove = useMutation({ mutationFn: removeConnection, onSuccess: invalidate });

  return {
    localStatus,
    pending: connect.isPending || remove.isPending,
    toggle: (userId: string, connected: boolean) => {
      if (connected) {
        remove.mutate(userId);
        setLocalStatus((status) => ({ ...status, [userId]: "REMOVED" }));
      } else {
        connect.mutate(userId);
        setLocalStatus((status) => ({ ...status, [userId]: "REQUESTED" }));
      }
    },
  };
}
