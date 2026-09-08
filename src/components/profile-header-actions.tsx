import { useProfileHeaderActionsController } from "@/utils/components/profile/use-profile-header-actions-controller";

import { ProfileEditAction } from "@/components/profile-edit-action";
import { ProfileHeaderActionButton } from "@/components/profile-header-action-button";

export function ProfileHeaderActions() {
  const { showEditAction, externalActions } = useProfileHeaderActionsController();

  return (
    <div className="flex flex-wrap gap-2">
      {showEditAction && <ProfileEditAction />}
      {externalActions.map((action) => (
        <ProfileHeaderActionButton key={action.key} action={action} />
      ))}
    </div>
  );
}
