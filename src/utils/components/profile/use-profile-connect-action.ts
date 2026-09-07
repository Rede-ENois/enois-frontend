import { useMutation, useQueryClient } from "@tanstack/react-query";

import { ApiError } from "@/lib/api-client";
import { connectToUser } from "@/lib/api/network/connect-to-user";

export function useProfileConnectAction(userId: string, requireAuth: () => boolean) {
  const queryClient = useQueryClient();
  const invalidateStatus = () =>
    queryClient.invalidateQueries({ queryKey: ["connection-status", userId] });
  const connect = useMutation({
    mutationFn: () => connectToUser(userId),
    onSuccess: invalidateStatus,
    onError: (error: unknown) => {
      if (error instanceof ApiError && error.code === "CONNECTION_ALREADY_REQUESTED") {
        invalidateStatus();
      }
    },
  });

  return {
    pending: connect.isPending,
    connect: () => {
      if (!requireAuth()) return;
      connect.mutate();
    },
  };
}
