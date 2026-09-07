import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Send, UserMinus, UserPlus } from "lucide-react";

import { texts } from "@/texts";

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

  const pending = connect.isPending || remove.isPending;
  const users = (data?.items ?? []).map((user) => {
    const requested = !user.connected && localStatus[user.id] === "REQUESTED";

    return {
      ...user,
      statusLabel: user.connected ? texts.network.connected : texts.network.commonInterests,
      connectionAction: {
        icon: user.connected ? UserMinus : requested ? Send : UserPlus,
        label: user.connected
          ? texts.network.remove
          : requested
            ? texts.network.requested
            : texts.network.connect,
        variant: user.connected ? ("outline" as const) : ("default" as const),
        className: user.connected ? "text-destructive hover:text-destructive" : "",
        disabled: pending,
        run: () => toggleConnection(user.id, user.connected),
      },
    };
  });

  return { users };
}
