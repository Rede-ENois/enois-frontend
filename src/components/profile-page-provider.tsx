import { ProfilePageContext } from "@/utils/components/profile/profile-page-context";
import { useProfilePageController } from "@/utils/components/profile/use-profile-page-controller";

import { Profile } from "@/components/pages/profile-page";

export function ProfilePageProvider() {
  const value = useProfilePageController();

  return (
    <ProfilePageContext.Provider value={value}>
      <Profile />
    </ProfilePageContext.Provider>
  );
}
