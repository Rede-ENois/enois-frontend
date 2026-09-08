import { texts } from "@/texts";
import { useProfileRecommendationsController } from "@/utils/components/profile/use-profile-recommendations-controller";
import { Star } from "lucide-react";

import { ProfileRecommendationItem } from "@/components/profile-recommendation-item";
import { ProfileSection } from "@/components/profile-section";

export function ProfileRecommendationsSection() {
  const { visible, recommendations } = useProfileRecommendationsController();

  if (!visible) return null;

  return (
    <ProfileSection title={texts.profile.sections.recommendations} icon={Star}>
      <div className="space-y-3">
        {recommendations.map((recommendation) => (
          <ProfileRecommendationItem key={recommendation.id} recommendation={recommendation} />
        ))}
      </div>
    </ProfileSection>
  );
}
