import { useMutation, useQueryClient } from "@tanstack/react-query";

import { acceptConnection } from "@/lib/api/network/accept-connection";
import { removeConnection } from "@/lib/api/network/remove-connection";

export function useNetworkRequestActions() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["network"] });
  const accept = useMutation({ mutationFn: acceptConnection, onSuccess: invalidate });
  const remove = useMutation({ mutationFn: removeConnection, onSuccess: invalidate });

  return {
    accept: (userId: string) => accept.mutate(userId),
    cancel: (userId: string) => remove.mutate(userId),
  };
}
