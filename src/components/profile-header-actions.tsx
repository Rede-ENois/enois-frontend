import type { ProfileHeaderActionsProps } from "@/types/components/profile/profile-header-actions-props";

import { ProfileEditAction } from "@/components/profile-edit-action";
import { ProfileExternalActions } from "@/components/profile-external-actions";

export function ProfileHeaderActions(props: ProfileHeaderActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {props.showEditAction && <ProfileEditAction profile={props.profile} />}
      {props.showExternalActions && (
        <ProfileExternalActions
          message={props.message}
          connectionAction={props.connectionAction}
        />
      )}
    </div>
  );
}
