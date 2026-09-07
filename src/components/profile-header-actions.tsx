import { MessageCircle, Settings } from "lucide-react";

import { texts } from "@/texts";
import type { ProfileHeaderActionsProps } from "@/types/components/profile/profile-header-actions-props";

import { Button } from "@/components/ui/button";

import { EditProfileDialog } from "@/components/edit-profile-dialog";

export function ProfileHeaderActions({
  profile,
  showEditAction,
  showExternalActions,
  message,
  connectionAction,
}: ProfileHeaderActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {showEditAction && (
        <EditProfileDialog profile={profile}>
          <Button variant="outline" size="sm" className="rounded-full gap-1.5">
            <Settings className="h-4 w-4" />

            <>{texts.profile.editProfile}</>
          </Button>
        </EditProfileDialog>
      )}

      {showExternalActions && (
        <>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full gap-1.5"
            onClick={message}
          >
            <MessageCircle className="h-4 w-4" />

            <>{texts.profile.message}</>
          </Button>

          <Button
            size="sm"
            className="rounded-full gap-1.5"
            onClick={connectionAction.run}
            disabled={connectionAction.disabled}
          >
            {connectionAction.label}
          </Button>
        </>
      )}
    </div>
  );
}
