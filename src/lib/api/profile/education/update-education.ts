import type { EducationRequest } from "@/types/application/profile/education-request";
import type { Education } from "@/types/application/profile/education";

import { apiRequest } from "@/lib/api-request";

export function updateEducation(id: string, data: EducationRequest) {
  return apiRequest<Education>("PUT", `/me/education/${id}`, data, { idempotent: true });
}
