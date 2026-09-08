import { apiRequest } from "@/lib/api-request";

export function markAllNotificationsAsRead() {
  return apiRequest<void>("POST", "/notifications/read-all", undefined, { idempotent: true });
}
