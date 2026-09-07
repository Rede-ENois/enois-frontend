import type { ProfileSidebarProps } from "@/types/components/profile/profile-sidebar-props";

import { ProfileAvailabilitySection } from "@/components/profile-availability-section";
import { ProfileExternalLinksSection } from "@/components/profile-external-links-section";
import { ProfileRankingSection } from "@/components/profile-ranking-section";
import { ProfileRecommendationSection } from "@/components/profile-recommendation-section";
import { ProfileRecommendationsSection } from "@/components/profile-recommendations-section";

export function ProfileSidebar({ user }: ProfileSidebarProps) {
  return (
    <aside className="space-y-6">
      <ProfileAvailabilitySection user={user} />
      <ProfileRecommendationSection user={user} />
      <ProfileRecommendationsSection user={user} />
      <ProfileRankingSection />
      <ProfileExternalLinksSection user={user} />
    </aside>
  );
}
