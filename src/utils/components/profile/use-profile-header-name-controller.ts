import { PROFILE_HEADER_BADGES } from "@/constants/profile-header-badges";
import { useProfilePageContext } from "@/utils/components/profile/use-profile-page-context";

export function useProfileHeaderNameController() {
  const { user } = useProfilePageContext();

  return {
    name: user.name,
    badges: PROFILE_HEADER_BADGES.filter((badge) => user[badge.field]),
  };
}
