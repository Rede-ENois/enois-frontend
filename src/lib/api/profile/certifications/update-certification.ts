import type { Certification } from "@/types/application/profile/certification";
import type { CertificationRequest } from "@/types/application/profile/certification-request";

import { apiRequest } from "@/lib/api-request";

export function updateCertification(id: string, data: CertificationRequest) {
  return apiRequest<Certification>("PUT", `/me/certifications/${id}`, data, { idempotent: true });
}
