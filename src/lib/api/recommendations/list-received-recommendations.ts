import type { Recommendation } from "@/types/application/recommendation/recommendation";

import { apiRequest } from "@/lib/api-request";

export function listReceivedRecommendations(userId: string) {
  return apiRequest<Recommendation[]>("GET", `/recommendations/received/${userId}`);
}
