import { ProfileAvailabilitySection } from "@/components/profile-availability-section";
import { ProfileExternalLinksSection } from "@/components/profile-external-links-section";
import { ProfileRankingSection } from "@/components/profile-ranking-section";
import { ProfileRecommendationSection } from "@/components/profile-recommendation-section";
import { ProfileRecommendationsSection } from "@/components/profile-recommendations-section";

export function ProfileSidebar() {
  return (
    <aside className="space-y-6">
      <ProfileAvailabilitySection />
      <ProfileRecommendationSection />
      <ProfileRecommendationsSection />
      <ProfileRankingSection />
      <ProfileExternalLinksSection />
    </aside>
  );
}
