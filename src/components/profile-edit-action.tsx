import { texts } from "@/texts";
import { Settings } from "lucide-react";

import { Button } from "@/components/ui/button";

import { EditProfileDialogProvider } from "@/components/edit-profile-dialog-provider";

export function ProfileEditAction() {
  return (
    <EditProfileDialogProvider>
      <Button variant="outline" size="sm" className="rounded-full gap-1.5">
        <Settings className="h-4 w-4" />

        <>{texts.profile.editProfile}</>
      </Button>
    </EditProfileDialogProvider>
  );
}
