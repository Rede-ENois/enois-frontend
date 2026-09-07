import { useQuery } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { RecommendationItemProps } from "@/types/components/profile/recommendation-item-props";

import { getProfileById } from "@/lib/api/profile/get-profile-by-id";

export function useProfileRecommendationItemController({
  recommendation,
}: RecommendationItemProps) {
  const { data: recommender } = useQuery({
    queryKey: ["profile", "by-id", recommendation.recommenderId],
    queryFn: () => getProfileById(recommendation.recommenderId),
  });

  return {
    recommender,
    recommenderName: recommender?.name ?? texts.profile.userFallback,
    quote: texts.profile.recommendationQuote(recommendation.comment),
  };
}
