import type { Certification } from "@/types/application/profile/certification";

import { apiRequest } from "@/lib/api-request";

export function listCertifications() {
  return apiRequest<Certification[]>("GET", "/me/certifications");
}
