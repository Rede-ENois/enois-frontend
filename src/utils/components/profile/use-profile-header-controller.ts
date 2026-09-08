import { useProfileHeaderMedia } from "@/utils/components/profile/use-profile-header-media";
import { useProfilePageContext } from "@/utils/components/profile/use-profile-page-context";

import { useAuth } from "@/lib/use-auth";

export function useProfileHeaderController() {
  const { user } = useProfilePageContext();
  const { user: me } = useAuth();
  const isOwnProfile = me?.id === user.id;

  return useProfileHeaderMedia(user, isOwnProfile);
}
