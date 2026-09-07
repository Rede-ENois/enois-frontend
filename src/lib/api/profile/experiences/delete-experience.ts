import { apiRequest } from "@/lib/api-request";

export function deleteExperience(id: string) {
  return apiRequest<void>("DELETE", `/me/experiences/${id}`, null, { idempotent: true });
}
