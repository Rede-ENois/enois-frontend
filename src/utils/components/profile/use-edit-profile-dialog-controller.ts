import { useState } from "react";

import { EDIT_PROFILE_TABS } from "@/constants/edit-profile-tabs";
import { useEditProfileInfo } from "@/utils/components/profile/use-edit-profile-info";
import { useProfilePageContext } from "@/utils/components/profile/use-profile-page-context";

export function useEditProfileDialogController() {
  const { user } = useProfilePageContext();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<(typeof EDIT_PROFILE_TABS)[number]["key"]>("info");
  const close = () => setOpen(false);
  const profileInfo = useEditProfileInfo(user, close);

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
