import { useState } from "react";

import type { Profile } from "@/lib/api";

import { EditProfileShell, type EditProfileTab } from "./edit-profile-shell";
import { EditProfileTabContent } from "./edit-profile-tab-content";
import { useEditProfileInfo } from "./use-edit-profile-info";

export function EditProfileDialog({ profile, children }: { profile: Profile; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<EditProfileTab>("info");
  const info = useEditProfileInfo(profile, () => setOpen(false));

  return (
    <EditProfileShell
      open={open}
      trigger={children}
      tab={tab}
      saving={info.saving}
      onOpenChange={setOpen}
      onTabChange={setTab}
      onSave={info.save}
    >
      <EditProfileTabContent
        tab={tab}
        values={info.values}
        usernameError={info.usernameError}
        onChange={info.onChange}
      />
    </EditProfileShell>
  );
}
