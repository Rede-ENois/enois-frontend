import { apiRequest } from "@/lib/api-request";

export function deleteCertification(id: string) {
  return apiRequest<void>("DELETE", `/me/certifications/${id}`, null, { idempotent: true });
}
