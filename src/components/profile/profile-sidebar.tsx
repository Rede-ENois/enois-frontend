import type { Profile, RankingUser, Recommendation } from "@/lib/api";

import { ProfileAvailabilitySection } from "./sidebar/profile-availability-section";
import { ProfileLinksSection } from "./sidebar/profile-links-section";
import { ProfileRankingSection } from "./sidebar/profile-ranking-section";
import { ProfileRecommendSection } from "./sidebar/profile-recommend-section";
import { ProfileRecommendationsSection } from "./sidebar/profile-recommendations-section";

export function ProfileSidebar({ user, isOwnProfile, recommendations, recommenders, ranking, recommendationOpen, recommendationComment, recommendationPending, onRecommendationOpenChange, onRecommendationCommentChange, onRecommendationSubmit }: {
  user: Profile;
  isOwnProfile: boolean;
  recommendations: Recommendation[];
  recommenders: Record<string, Profile>;
  ranking: RankingUser[];
  recommendationOpen: boolean;
  recommendationComment: string;
  recommendationPending: boolean;
  onRecommendationOpenChange: (open: boolean) => void;
  onRecommendationCommentChange: (value: string) => void;
  onRecommendationSubmit: () => void;
}) {
  return (
    <aside className="space-y-6">
      <ProfileAvailabilitySection availability={user.availability} />
      {!isOwnProfile && (
        <ProfileRecommendSection
          user={user}
          open={recommendationOpen}
          comment={recommendationComment}
          pending={recommendationPending}
          onOpenChange={onRecommendationOpenChange}
          onCommentChange={onRecommendationCommentChange}
          onSubmit={onRecommendationSubmit}
        />
      )}
      <ProfileRecommendationsSection recommendations={recommendations} recommenders={recommenders} />
      <ProfileRankingSection ranking={ranking} />
      <ProfileLinksSection links={user.externalLinks} />
    </aside>
  );
}
