import { useQuery } from "@tanstack/react-query";

import { useProfilePageContext } from "@/utils/components/profile/use-profile-page-context";

import { listReceivedRecommendations } from "@/lib/api/recommendations";

export function useProfileRecommendationsController() {
  const { user } = useProfilePageContext();
  const { data: recommendations = [] } = useQuery({
    queryKey: ["recommendations", user.id],
    queryFn: () => listReceivedRecommendations(user.id),
  });

  return {
    visible: recommendations.length > 0,
    recommendations,
  };
}
