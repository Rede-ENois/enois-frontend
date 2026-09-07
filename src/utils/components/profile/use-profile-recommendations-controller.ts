import { useQuery } from "@tanstack/react-query";

import type { ProfileSidebarProps } from "@/types/components/profile/profile-sidebar-props";

import { listReceivedRecommendations } from "@/lib/api/recommendations";

export function useProfileRecommendationsController({ user }: ProfileSidebarProps) {
  const { data: recommendations = [] } = useQuery({
    queryKey: ["recommendations", user.id],
    queryFn: () => listReceivedRecommendations(user.id),
  });

  return {
    visible: recommendations.length > 0,
    recommendations,
  };
}
