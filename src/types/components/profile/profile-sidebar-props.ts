import type { Profile, RankingUser, Recommendation } from "@/lib/api";

export type ProfileSidebarProps = {
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
