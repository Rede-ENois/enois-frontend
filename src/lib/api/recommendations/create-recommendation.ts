import type { CreateRecommendationInput } from "@/types/application/recommendation/create-recommendation-input";
import type { Recommendation } from "@/types/application/recommendation/recommendation";

import { apiRequest } from "@/lib/api-request";

export function createRecommendation(targetId: string, data: CreateRecommendationInput) {
  return apiRequest<Recommendation>("POST", `/recommendations/${targetId}`, data, {
    idempotent: true,
  });
}
