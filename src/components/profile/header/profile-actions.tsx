import { MessageCircle, Settings } from "lucide-react";

import { texts } from "@/texts";
import type { ProfileActionsProps } from "@/types/components/profile/header/profile-actions-props";

import { EditProfileDialog } from "@/components/profile/edit/edit-profile-dialog";
import { Button } from "@/components/ui/button";

export function ProfileActions({
  user,
  isOwnProfile,
  connectionLabel,
  isConnectionDisabled,
  onMessage,
  onConnect,
}: ProfileActionsProps) {
  if (isOwnProfile) {
    return (
      <EditProfileDialog profile={user}>
        <Button variant="outline" size="sm" className="rounded-full gap-1.5">
          <Settings className="h-4 w-4" /> {texts.profile.editProfile}
        </Button>
      </EditProfileDialog>
    );
  }

  return (
    <>
      <Button variant="outline" size="sm" className="rounded-full gap-1.5" onClick={onMessage}>
        <MessageCircle className="h-4 w-4" /> {texts.profile.message}
      </Button>
      <Button size="sm" className="rounded-full gap-1.5" onClick={onConnect} disabled={isConnectionDisabled}>
        {connectionLabel}
      </Button>
    </>
  );
}
