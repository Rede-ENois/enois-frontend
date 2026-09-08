import type { ProfileHeaderActionsProps } from "@/types/components/profile/profile-header-actions-props";
import { useProfileHeaderActionsController } from "@/utils/components/profile/use-profile-header-actions-controller";

import { ProfileEditAction } from "@/components/profile-edit-action";
import { ProfileHeaderActionButton } from "@/components/profile-header-action-button";

export function ProfileHeaderActions({ profile }: ProfileHeaderActionsProps) {
  const { showEditAction, externalActions } = useProfileHeaderActionsController(profile);

  return (
    <div className="flex flex-wrap gap-2">
      {showEditAction && <ProfileEditAction profile={profile} />}
      {externalActions.map((action) => (
        <ProfileHeaderActionButton key={action.key} action={action} />
      ))}
    </div>
  );
}
