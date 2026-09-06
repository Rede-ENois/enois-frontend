import type { Profile, Recommendation } from "@/lib/api";

export type ProfileRecommendationsSectionProps = {
  recommendations: Recommendation[];
  recommenders: Record<string, Profile>;
};
