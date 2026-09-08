import { ThumbsUp } from "lucide-react";

import { useAuth } from "@/lib/use-auth";
import { texts } from "@/texts";
import type { ProfileSidebarProps } from "@/types/components/profile/profile-sidebar-props";

import { ProfileRecommendationDialog } from "@/components/profile-recommendation-dialog";
import { ProfileSection } from "@/components/profile-section";

export function ProfileRecommendationSection({ user }: ProfileSidebarProps) {
  const { user: me } = useAuth();

  if (me?.id === user.id) return null;

  return (
    <ProfileSection title={texts.profile.sections.recommend} icon={ThumbsUp}>
      <p className="mb-3 text-[13px] font-light text-text-subtle">
        {texts.profile.recommendDescription}
      </p>

      <ProfileRecommendationDialog user={user} />
    </ProfileSection>
  );
}
