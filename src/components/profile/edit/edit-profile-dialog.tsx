import { useState } from "react";

import type { Profile } from "@/lib/api";

import { EditProfileShell, type EditProfileTab } from "./edit-profile-shell";
import { EditProfileTabContent } from "./edit-profile-tab-content";
import { useEditProfileInfo } from "./use-edit-profile-info";

type EditProfileDialogProps = {
  profile: Profile;
  children: React.ReactNode;
};

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
