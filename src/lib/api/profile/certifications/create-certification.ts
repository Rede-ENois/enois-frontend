import type { CertificationRequest } from "@/types/application/profile/certification-request";
import type { Certification } from "@/types/application/profile/certification";

import { apiRequest } from "@/lib/api-request";

export function createCertification(data: CertificationRequest) {
  return apiRequest<Certification>("POST", "/me/certifications", data, { idempotent: true });
}
