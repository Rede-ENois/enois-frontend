import { apiRequest } from "@/lib/api-request";

export function deleteEducation(id: string) {
  return apiRequest<void>("DELETE", `/me/education/${id}`, null, { idempotent: true });
}
