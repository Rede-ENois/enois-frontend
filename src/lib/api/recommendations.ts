import type { CreateRecommendationInput } from "@/types/application/recommendation/create-recommendation-input";
import type { Recommendation } from "@/types/application/recommendation/recommendation";

import { apiRequest } from "../api-request";

export const recommendationsApi = {
  create: (targetId: string, data: CreateRecommendationInput) => apiRequest<Recommendation>("POST", `/recommendations/${targetId}`, data, { idempotent: true }),
  listReceived: (userId: string) => apiRequest<Recommendation[]>("GET", `/recommendations/received/${userId}`),
};
