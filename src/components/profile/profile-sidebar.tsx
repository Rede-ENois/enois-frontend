import type { Profile, RankingUser, Recommendation } from "@/lib/api";

import { ProfileAvailabilitySection } from "./sidebar/profile-availability-section";
import { ProfileLinksSection } from "./sidebar/profile-links-section";
import { ProfileRankingSection } from "./sidebar/profile-ranking-section";
import { ProfileRecommendSection } from "./sidebar/profile-recommend-section";
import { ProfileRecommendationsSection } from "./sidebar/profile-recommendations-section";

type ProfileSidebarProps = {
  user: Profile;
  isOwnProfile: boolean;
  recommendations: Recommendation[];
  recommenderByUserId: Record<string, Profile>;
  ranking: RankingUser[];
  isRecommendationOpen: boolean;
  recommendationComment: string;
  isRecommendationPending: boolean;
  onRecommendationOpenChange: (isOpen: boolean) => void;
  onRecommendationCommentChange: (value: string) => void;
  onRecommendationSubmit: () => void;
};

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
