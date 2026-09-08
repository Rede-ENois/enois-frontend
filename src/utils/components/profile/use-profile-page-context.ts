import { useContext } from "react";

import { ProfilePageContext } from "@/utils/components/profile/profile-page-context";

export function useProfilePageContext() {
  const context = useContext(ProfilePageContext);

  if (!context) {
    throw new Error("Profile page components must be rendered inside ProfilePageProvider");
  }

  return context;
}
