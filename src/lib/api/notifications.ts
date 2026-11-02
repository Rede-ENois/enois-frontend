import type { PageResponse } from "@/types/application/api/page-response";
import type { Notification } from "@/types/application/notification/notification";
import type { NotificationPreferences } from "@/types/application/notification/notification-preferences";
import type { InterfaceContext } from "@rede-enois/design-system/domain";

import { api, buildQuery } from "../api-client";

export const notificationsApi = {
  /** `context`: notifications of that interface plus the account-wide ones (omitted = all). */
  list: (cursor?: string | null, limit = 20, context?: InterfaceContext) =>
    api.get<PageResponse<Notification>>(`/notifications${buildQuery({ cursor, limit, context })}`),

  markAsRead: (notificationId: string) => api.post<void>(`/notifications/${notificationId}/read`),

  markAllAsRead: () => api.post<void>("/notifications/read-all"),

  preferences: () => api.get<NotificationPreferences>("/me/notification-preferences"),

  /** Atualização parcial: só os campos enviados mudam; devolve todas as preferências. */
  updatePreferences: (data: Partial<Omit<NotificationPreferences, "updatedAt">>) =>
    api.put<NotificationPreferences>("/me/notification-preferences", data),
};
