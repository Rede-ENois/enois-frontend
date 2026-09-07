import type { Experience } from "@/types/application/profile/experience";

import { apiRequest } from "@/lib/api-request";

export function listExperiences() {
  return apiRequest<Experience[]>("GET", "/me/experiences");
}
