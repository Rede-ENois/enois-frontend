import { ThumbsUp } from "lucide-react";

import { texts } from "@/texts";
import { useProfilePageContext } from "@/utils/components/profile/use-profile-page-context";

import { useAuth } from "@/lib/use-auth";

import { ProfileRecommendationDialog } from "@/components/profile-recommendation-dialog";
import { ProfileSection } from "@/components/profile-section";

export function ProfileRecommendationSection() {
  const { user } = useProfilePageContext();
  const { user: me } = useAuth();

  if (me?.id === user.id) return null;

  return (
    <ProfileSection title={texts.profile.sections.recommend} icon={ThumbsUp}>
      <p className="mb-3 text-[13px] font-light text-text-subtle">
        {texts.profile.recommendDescription}
      </p>

      <ProfileRecommendationDialog />
    </ProfileSection>
  );
}
