import type { Profile } from "@/types/application/profile/profile";
import { useProfileHeaderMedia } from "@/utils/components/profile/use-profile-header-media";

import { useAuth } from "@/lib/use-auth";

export function useProfileHeaderController(user: Profile) {
  const { user: me } = useAuth();
  const isOwnProfile = me?.id === user.id;

  return useProfileHeaderMedia(user, isOwnProfile);
}
