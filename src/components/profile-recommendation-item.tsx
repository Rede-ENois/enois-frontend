import type { RecommendationItemProps } from "@/types/components/profile/recommendation-item-props";

import { useProfileRecommendationItemController } from "@/utils/components/profile/use-profile-recommendation-item-controller";

import { UserAvatar } from "@/components/user-avatar";

export function ProfileRecommendationItem(props: RecommendationItemProps) {
  const { recommender, recommenderName, quote } = useProfileRecommendationItemController(props);

  return (
    <div className="rounded-xl bg-surface-1 p-3">
      <div className="mb-2 flex items-center gap-2">
        <UserAvatar src={recommender?.avatar} alt={recommender?.name} className="h-6 w-6" />

        <span className="text-[12px] font-medium text-text-strong">{recommenderName}</span>
      </div>

      <p className="break-words text-[13px] font-light leading-relaxed text-text-subtle">
        {quote}
      </p>
    </div>
  );
}
