import { Star } from "lucide-react";

import { texts } from "@/texts";
import type { ProfileRecommendationsSectionProps } from "@/types/components/profile/sidebar/profile-recommendations-section-props";

import { UserAvatar } from "@/components/user-avatar";
import { ProfileSection } from "../profile-section";

export function ProfileRecommendationsSection({ recommendations, recommenders }: ProfileRecommendationsSectionProps) {
  if (recommendations.length === 0) return null;

  return (
    <ProfileSection title={texts.profile.sections.recommendations} icon={Star}>
      <div className="space-y-3">
        {recommendations.map((recommendation) => {
          const recommender = recommenders[recommendation.recommenderId];
          return (
            <div key={recommendation.id} className="rounded-xl bg-surface-1 p-3">
              <div className="mb-2 flex items-center gap-2">
                <UserAvatar src={recommender?.avatar} alt={recommender?.name} className="h-6 w-6" />
                <span className="text-[12px] font-medium text-text-strong">{recommender?.name ?? texts.profile.userFallback}</span>
              </div>
              <p className="break-words text-[13px] font-light leading-relaxed text-text-subtle">“{recommendation.comment}”</p>
            </div>
          );
        })}
      </div>
    </ProfileSection>
  );
}
