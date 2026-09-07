import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import type { Profile } from "@/types/application/profile/profile";

import { ApiError } from "@/lib/api-client";
import { connectToUser } from "@/lib/api/network/connect-to-user";
import { getConnectionStatus } from "@/lib/api/network/get-connection-status";
import { useAuth } from "@/lib/use-auth";

export function useProfileHeaderActions(user: Profile) {
  const { user: me, requireAuth } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isOwnProfile = me?.id === user.id;

  const { data: connectionData } = useQuery({
    queryKey: ["connection-status", user.id],
    queryFn: () => getConnectionStatus(user.id),
    enabled: !isOwnProfile && !!me,
  });

  const connect = useMutation({
    mutationFn: () => connectToUser(user.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connection-status", user.id] });
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError && error.code === "CONNECTION_ALREADY_REQUESTED") {
        queryClient.invalidateQueries({ queryKey: ["connection-status", user.id] });
      }
    },
  });

  const handleMessage = () => {
    if (!requireAuth()) return;
    navigate({ to: "/mensagens" });
  };

  const handleConnect = () => {
    if (!requireAuth()) return;
    connect.mutate();
  };

  return {
    isOwnProfile,
    connectionStatus: connectionData?.status ?? null,
    connectionPending: connect.isPending,
    handleMessage,
    handleConnect,
  };
}
