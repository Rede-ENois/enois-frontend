import type { ExperienceRequest } from "@/types/application/profile/experience-request";
import type { Experience } from "@/types/application/profile/experience";

import { apiRequest } from "@/lib/api-request";

export function createExperience(data: ExperienceRequest) {
  return apiRequest<Experience>("POST", "/me/experiences", data, { idempotent: true });
}
