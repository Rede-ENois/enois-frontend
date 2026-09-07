import type { ExperienceRequest } from "@/types/application/profile/experience-request";
import type { Experience } from "@/types/application/profile/experience";

import { apiRequest } from "@/lib/api-request";

export function updateExperience(id: string, data: ExperienceRequest) {
  return apiRequest<Experience>("PUT", `/me/experiences/${id}`, data, { idempotent: true });
}
