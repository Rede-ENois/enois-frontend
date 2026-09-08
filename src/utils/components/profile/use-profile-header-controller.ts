import type { Profile } from "@/types/application/profile/profile";
import { createProfileConnectionAction } from "@/utils/components/profile/create-profile-connection-action";
import { useProfileHeaderActions } from "@/utils/components/profile/use-profile-header-actions";
import { useProfileHeaderMedia } from "@/utils/components/profile/use-profile-header-media";

export function useProfileHeaderController(user: Profile) {
  const actions = useProfileHeaderActions(user);
  const media = useProfileHeaderMedia(user, actions.isOwnProfile);

  return {
    ...media,
    showEditAction: actions.isOwnProfile,
    showExternalActions: !actions.isOwnProfile,
    message: actions.handleMessage,
    connectionAction: createProfileConnectionAction(
      actions.connectionStatus,
      actions.connectionPending,
      actions.handleConnect,
    ),
  };
}
