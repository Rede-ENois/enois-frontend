import { useMutation, useQueryClient } from "@tanstack/react-query";

import { connectToUser } from "@/lib/api/network/connect-to-user";
import { removeConnection } from "@/lib/api/network/remove-connection";

export function useNetworkConnectionMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["network"] });
  const connect = useMutation({ mutationFn: connectToUser, onSuccess: invalidate });
  const remove = useMutation({ mutationFn: removeConnection, onSuccess: invalidate });

  return {
    pending: connect.isPending || remove.isPending,
    connect: (userId: string) => connect.mutate(userId),
    remove: (userId: string) => remove.mutate(userId),
  };
}
