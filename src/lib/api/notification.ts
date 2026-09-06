import type { Notification } from "@/types/application/notification/notification";
import type { PageResponse } from "@/types/application/pagination/page-response";

import { api, buildQuery } from "../api-client";

export type { Notification } from "@/types/application/notification/notification";

export const notificationApi = {
  list: (cursor?: string | null, limit = 20) =>
    api.get<PageResponse<Notification>>(`/notifications${buildQuery({ cursor, limit })}`),

  markRead: (notificationId: string) => api.post<void>(`/notifications/${notificationId}/read`),

  markAllRead: () => api.post<void>("/notifications/read-all"),
};
