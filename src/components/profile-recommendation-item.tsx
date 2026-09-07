import { useQuery } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { RecommendationItemProps } from "@/types/components/profile/recommendation-item-props";

import { getProfileById } from "@/lib/api/profile/get-profile-by-id";

import { UserAvatar } from "@/components/user-avatar";

export function ProfileRecommendationItem({ recommendation }: RecommendationItemProps) {
  const { data: recommender } = useQuery({
    queryKey: ["profile", "by-id", recommendation.recommenderId],
    queryFn: () => getProfileById(recommendation.recommenderId),
  });

  return (
    <div className="rounded-xl bg-surface-1 p-3">
      <div className="mb-2 flex items-center gap-2">
        <UserAvatar src={recommender?.avatar} alt={recommender?.name} className="h-6 w-6" />

        <span className="text-[12px] font-medium text-text-strong">
          {recommender?.name ?? texts.profile.userFallback}
        </span>
      </div>

      <p className="break-words text-[13px] font-light leading-relaxed text-text-subtle">
        {texts.profile.recommendationQuote(recommendation.comment)}
      </p>
    </div>
  );
}
