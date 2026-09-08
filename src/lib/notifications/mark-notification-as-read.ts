import { apiRequest } from "@/lib/api-request";

export function markNotificationAsRead(notificationId: string) {
  return apiRequest<void>("POST", `/notifications/${notificationId}/read`, undefined, {
    idempotent: true,
  });
}
