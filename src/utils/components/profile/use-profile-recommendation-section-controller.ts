import { useProfilePageContext } from "@/utils/components/profile/use-profile-page-context";

import { useAuth } from "@/lib/use-auth";

export function useProfileRecommendationSectionController() {
  const { user } = useProfilePageContext();
  const { user: currentUser } = useAuth();

  return {
    visible: currentUser?.id !== user.id,
  };
}
