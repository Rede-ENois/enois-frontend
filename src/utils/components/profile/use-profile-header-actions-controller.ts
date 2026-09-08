import { MessageCircle } from "lucide-react";

import { texts } from "@/texts";
import type { Profile } from "@/types/application/profile/profile";
import type { ProfileHeaderAction } from "@/types/components/profile/profile-header-action";
import { createProfileConnectionAction } from "@/utils/components/profile/create-profile-connection-action";
import { useProfileHeaderActions } from "@/utils/components/profile/use-profile-header-actions";

export function useProfileHeaderActionsController(profile: Profile) {
  const actions = useProfileHeaderActions(profile);
  const connectionAction = createProfileConnectionAction(
    actions.connectionStatus,
    actions.connectionPending,
    actions.handleConnect,
  );

  const externalActions: ProfileHeaderAction[] = actions.isOwnProfile
    ? []
    : [
        {
          key: "message",
          label: texts.profile.message,
          icon: MessageCircle,
          variant: "outline",
          onClick: actions.handleMessage,
          disabled: false,
        },
        {
          key: "connection",
          label: connectionAction.label,
          icon: null,
          variant: "default",
          onClick: connectionAction.run,
          disabled: connectionAction.disabled,
        },
      ];

  return {
    showEditAction: actions.isOwnProfile,
    externalActions,
  };
}
