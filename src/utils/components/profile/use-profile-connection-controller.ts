import { useProfileConnectAction } from "@/utils/components/profile/use-profile-connect-action";
import { useProfileConnectionStatus } from "@/utils/components/profile/use-profile-connection-status";

export function useProfileConnectionController(
  userId: string,
  enabled: boolean,
  requireAuth: () => boolean,
) {
  const status = useProfileConnectionStatus(userId, enabled);
  const action = useProfileConnectAction(userId, requireAuth);

  return {
    status,
    pending: action.pending,
    connect: action.connect,
  };
}
