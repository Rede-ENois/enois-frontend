import type { Profile } from "@/types/application/profile/profile";
import { useProfileConnectionController } from "@/utils/components/profile/use-profile-connection-controller";
import { useProfileMessageAction } from "@/utils/components/profile/use-profile-message-action";

import { useAuth } from "@/lib/use-auth";

export function useProfileHeaderActions(user: Profile) {
  const { user: me, requireAuth } = useAuth();
  const isOwnProfile = me?.id === user.id;
  const connection = useProfileConnectionController(user.id, !isOwnProfile && !!me, requireAuth);
  const message = useProfileMessageAction(requireAuth);

  return {
    isOwnProfile,
    connectionStatus: connection.status,
    connectionPending: connection.pending,
    handleMessage: message,
    handleConnect: connection.connect,
  };
}
