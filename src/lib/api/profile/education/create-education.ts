import type { EducationRequest } from "@/types/application/profile/education-request";
import type { Education } from "@/types/application/profile/education";

import { apiRequest } from "@/lib/api-request";

export function createEducation(data: EducationRequest) {
  return apiRequest<Education>("POST", "/me/education", data, { idempotent: true });
}
