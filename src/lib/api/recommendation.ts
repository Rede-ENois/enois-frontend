import type { CreateRecommendationInput, Recommendation } from "@/types/application/recommendation/recommendation";

import { api } from "../api-client";

export type { CreateRecommendationInput, Recommendation } from "@/types/application/recommendation/recommendation";

export const recommendationApi = {
  create: (recommendedUserId: string, input: CreateRecommendationInput) =>
    api.post<Recommendation>(`/recommendations/${recommendedUserId}`, input),

  listReceived: (userId: string) =>
    api.get<Recommendation[]>(`/recommendations/received/${userId}`),
};
