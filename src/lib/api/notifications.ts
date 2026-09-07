import type { PageResponse } from "@/types/application/api/page-response";
import type { Notification } from "@/types/application/notification/notification";
import { buildQuery } from "@/utils/build-query";

import { apiRequest } from "../api-request";

export const notificationsApi = {
  list: (cursor?: string | null, limit = 20) => apiRequest<PageResponse<Notification>>("GET", `/notifications${buildQuery({ cursor, limit })}`),
  markAsRead: (notificationId: string) => apiRequest<void>("POST", `/notifications/${notificationId}/read`, undefined, { idempotent: true }),
  markAllAsRead: () => apiRequest<void>("POST", "/notifications/read-all", undefined, { idempotent: true }),
};
