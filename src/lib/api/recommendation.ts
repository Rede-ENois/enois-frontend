import { api } from "../api-client";

export interface Recommendation {
  id: string;
  recommenderId: string;
  recommendedId: string;
  comment: string;
  createdAt: string;
}

export interface CreateRecommendationInput {
  comment: string;
}

export const recommendationApi = {
  create: (recommendedUserId: string, input: CreateRecommendationInput) =>
    api.post<Recommendation>(`/recommendations/${recommendedUserId}`, input),

  listReceived: (userId: string) =>
    api.get<Recommendation[]>(`/recommendations/received/${userId}`),
};
