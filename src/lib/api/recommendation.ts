import type { CreateRecommendationInput } from "@/types/application/recommendation/create-recommendation-input";
import type { Recommendation } from "@/types/application/recommendation/recommendation";

import { api } from "../api-client";

export type { CreateRecommendationInput } from "@/types/application/recommendation/create-recommendation-input";
export type { Recommendation } from "@/types/application/recommendation/recommendation";

export const recommendationApi = {
  create: (recommendedUserId: string, input: CreateRecommendationInput) =>
    api.post<Recommendation>(`/recommendations/${recommendedUserId}`, input),

  listReceived: (userId: string) =>
    api.get<Recommendation[]>(`/recommendations/received/${userId}`),
};
