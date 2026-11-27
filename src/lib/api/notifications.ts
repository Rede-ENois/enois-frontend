import type { PageResponse } from "@/types/application/api/page-response";
import type { Notification } from "@/types/application/notification/notification";
import type { NotificationPreferences } from "@/types/application/notification/notification-preferences";
import type { UnreadSummary } from "@/types/application/notification/unread-summary";
import type { InterfaceContext } from "@rede-enois/design-system/domain";

import { api, buildQuery } from "../api-client";

export const notificationsApi = {
  /**
   * `context`: notifications of that interface plus the account-wide ones (omitted = all).
   * `unreadFirst`: unread rows first (newest to oldest), then the read ones; the cursor becomes a
   * position in that order (`o:<n>`). Without it the request is the plain arrival-order list.
   */
  list: (
    cursor?: string | null,
    limit = 20,
    context?: InterfaceContext,
    options?: { unreadFirst?: boolean },
  ) =>
    api.get<PageResponse<Notification>>(
      `/notifications${buildQuery({
        cursor,
        limit,
        context,
        unreadFirst: options?.unreadFirst === true ? true : undefined,
      })}`,
    ),

  /** Unread count per area, for the menu and dock signals (same `context` filter as `list`). */
  unreadSummary: (context?: InterfaceContext) =>
    api.get<UnreadSummary>(`/notifications/unread-summary${buildQuery({ context })}`),

  markAsRead: (notificationId: string) => api.post<void>(`/notifications/${notificationId}/read`),

  markAllAsRead: () => api.post<void>("/notifications/read-all"),

  preferences: () => api.get<NotificationPreferences>("/me/notification-preferences"),

  /** Atualização parcial: só os campos enviados mudam; devolve todas as preferências. */
  updatePreferences: (data: Partial<Omit<NotificationPreferences, "updatedAt">>) =>
    api.put<NotificationPreferences>("/me/notification-preferences", data),
};
