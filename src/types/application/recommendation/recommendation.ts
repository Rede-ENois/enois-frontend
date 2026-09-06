export type Recommendation = {
  id: string;
  recommenderId: string;
  recommendedId: string;
  comment: string;
  createdAt: string;
};

export type CreateRecommendationInput = Pick<Recommendation, "comment">;
