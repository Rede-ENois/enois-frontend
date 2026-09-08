import { useContext } from "react";

import { ProfileHeaderContext } from "@/utils/components/profile/profile-header-context";

export function useProfileHeaderContext() {
  const context = useContext(ProfileHeaderContext);

  if (!context) {
    throw new Error("Profile header components must be rendered inside ProfileHeaderProvider");
  }

  return context;
}
