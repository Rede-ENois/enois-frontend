import type { Recommendation } from "@/types/application/recommendation/recommendation";

export type RecommendationItemProps = {
  recommendation: Pick<Recommendation, "recommenderId" | "comment">;
};
