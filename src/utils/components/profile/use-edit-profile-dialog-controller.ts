import { useState } from "react";

import { EDIT_PROFILE_TABS } from "@/constants/edit-profile-tabs";
import type { Profile } from "@/types/application/profile/profile";

import { useEditProfileInfo } from "@/utils/components/profile/use-edit-profile-info";

export function useEditProfileDialogController(profile: Profile) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<(typeof EDIT_PROFILE_TABS)[number]["key"]>("info");
  const close = () => setOpen(false);
  const profileInfo = useEditProfileInfo(profile, close);

  return {
    open,
    setOpen,
    close,
    activeTab,
    tabs: EDIT_PROFILE_TABS.map((item) => ({
      ...item,
      selected: activeTab === item.key,
      select: () => setActiveTab(item.key),
    })),
    profileInfo,
  };
}
