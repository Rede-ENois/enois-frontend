import { texts } from "@/texts";
import { useProfileRecommendationSectionController } from "@/utils/components/profile/use-profile-recommendation-section-controller";
import { ThumbsUp } from "lucide-react";

import { ProfileRecommendationDialog } from "@/components/profile-recommendation-dialog";
import { ProfileSection } from "@/components/profile-section";

export function ProfileRecommendationSection() {
  const { visible } = useProfileRecommendationSectionController();

  if (!visible) return null;

  return (
    <ProfileSection title={texts.profile.sections.recommend} icon={ThumbsUp}>
      <p className="mb-3 text-[13px] font-light text-text-subtle">
        {texts.profile.recommendDescription}
      </p>

      <ProfileRecommendationDialog />
    </ProfileSection>
  );
}
