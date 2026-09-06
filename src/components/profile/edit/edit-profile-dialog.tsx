import { useState } from "react";

import type { EditProfileDialogProps } from "@/types/components/profile/edit/edit-profile-dialog-props";
import type { EditProfileTab } from "@/types/components/profile/edit/edit-profile-tab";

import { EditProfileShell } from "./edit-profile-shell";
import { EditProfileTabContent } from "./edit-profile-tab-content";
import { useEditProfileInfo } from "./use-edit-profile-info";

export function EditProfileDialog({ profile, children }: EditProfileDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<EditProfileTab>("info");
  const profileInfo = useEditProfileInfo(profile, () => setIsOpen(false));

  return (
    <EditProfileShell
      isOpen={isOpen}
      trigger={children}
      tab={tab}
      isSaving={profileInfo.isSaving}
      onOpenChange={setIsOpen}
      onTabChange={setTab}
      onSave={profileInfo.handleSave}
    >
      <EditProfileTabContent
        tab={tab}
        values={profileInfo.values}
        usernameError={profileInfo.usernameError}
        onChange={profileInfo.handleChange}
      />
    </EditProfileShell>
  );
}
