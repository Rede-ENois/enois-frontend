import { Settings } from "lucide-react";

import { texts } from "@/texts";
import type { ProfileEditActionProps } from "@/types/components/profile/profile-edit-action-props";

import { Button } from "@/components/ui/button";
import { EditProfileDialog } from "@/components/edit-profile-dialog";

export function ProfileEditAction({ profile }: ProfileEditActionProps) {
  return (
    <EditProfileDialog profile={profile}>
      <Button variant="outline" size="sm" className="rounded-full gap-1.5">
        <Settings className="h-4 w-4" />
        <>{texts.profile.editProfile}</>
      </Button>
    </EditProfileDialog>
  );
}
