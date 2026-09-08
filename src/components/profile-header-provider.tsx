import { ProfileHeaderContext } from "@/utils/components/profile/profile-header-context";
import { useProfileHeaderController } from "@/utils/components/profile/use-profile-header-controller";

import { ProfileHeader } from "@/components/profile-header";

export function ProfileHeaderProvider() {
  const controller = useProfileHeaderController();

  return (
    <ProfileHeaderContext.Provider value={controller}>
      <ProfileHeader />
    </ProfileHeaderContext.Provider>
  );
}
