import { api, buildQuery } from "../api-client";

export interface Notification {
  id: string;
  kind: string;
  actorId: string | null;
  actorName: string | null;
  actorAvatar: string | null;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  href: string;
  ctaLabel: string;
}

export interface PageResponse<T> {
  items: T[];
  nextCursor: string | null;
}

export const notificationApi = {
  list: (cursor?: string | null, limit = 20) =>
    api.get<PageResponse<Notification>>(`/notifications${buildQuery({ cursor, limit })}`),

  markRead: (notificationId: string) => api.post<void>(`/notifications/${notificationId}/read`),

  markAllRead: () => api.post<void>("/notifications/read-all"),
};
