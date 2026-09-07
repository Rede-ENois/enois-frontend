import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ApiError } from "@/lib/api-client";
import { connectToUser } from "@/lib/api/network/connect-to-user";
import { getConnectionStatus } from "@/lib/api/network/get-connection-status";

export function useProfileConnectionController(
  userId: string,
  enabled: boolean,
  requireAuth: () => boolean,
) {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ["connection-status", userId],
    queryFn: () => getConnectionStatus(userId),
    enabled,
  });
  const connect = useMutation({
    mutationFn: () => connectToUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connection-status", userId] });
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError && error.code === "CONNECTION_ALREADY_REQUESTED") {
        queryClient.invalidateQueries({ queryKey: ["connection-status", userId] });
      }
    },
  });

  return {
    status: data?.status ?? null,
    pending: connect.isPending,
    connect: () => {
      if (!requireAuth()) return;
      connect.mutate();
    },
  };
}
