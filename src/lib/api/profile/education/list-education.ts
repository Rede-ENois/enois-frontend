import type { Education } from "@/types/application/profile/education";

import { apiRequest } from "@/lib/api-request";

export function listEducation() {
  return apiRequest<Education[]>("GET", "/me/education");
}
