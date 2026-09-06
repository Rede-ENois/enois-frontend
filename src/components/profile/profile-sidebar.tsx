import type { ProfileSidebarProps } from "@/types/components/profile/profile-sidebar-props";

import { ProfileAvailabilitySection } from "./sidebar/profile-availability-section";
import { ProfileLinksSection } from "./sidebar/profile-links-section";
import { ProfileRankingSection } from "./sidebar/profile-ranking-section";
import { ProfileRecommendSection } from "./sidebar/profile-recommend-section";
import { ProfileRecommendationsSection } from "./sidebar/profile-recommendations-section";

export function ProfileSidebar({
  user,
  isOwnProfile,
  recommendations,
  recommenderByUserId,
  ranking,
  isRecommendationOpen,
  recommendationComment,
  isRecommendationPending,
  onRecommendationOpenChange,
  onRecommendationCommentChange,
  onRecommendationSubmit,
}: ProfileSidebarProps) {
  return (
    <aside className="space-y-6">
      <ProfileAvailabilitySection availability={user.availability} />
      {!isOwnProfile && (
        <ProfileRecommendSection
          user={user}
          isOpen={isRecommendationOpen}
          comment={recommendationComment}
          isPending={isRecommendationPending}
          onOpenChange={onRecommendationOpenChange}
          onCommentChange={onRecommendationCommentChange}
          onSubmit={onRecommendationSubmit}
        />
      )}
      <ProfileRecommendationsSection
        recommendations={recommendations}
        recommenders={recommenderByUserId}
      />
      <ProfileRankingSection ranking={ranking} />
      <ProfileLinksSection links={user.externalLinks} />
    </aside>
  );
}
