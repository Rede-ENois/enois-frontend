import { useMutation, useQueryClient } from "@tanstack/react-query";

import { acceptConnection } from "@/lib/api/network/accept-connection";

export function useNotificationConnectionAction() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: acceptConnection,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["network"] }),
  });

  return (actorId: string) => mutation.mutate(actorId);
}
