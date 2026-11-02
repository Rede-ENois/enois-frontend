import type { NotificationModule } from "@/types/application/notification/notification-module";

/** `GET /notifications/unread-summary`: unread notifications per area (only areas with some). */
export type UnreadSummary = {
  total: number;
  byModule: Partial<Record<NotificationModule, number>>;
  /** Unread notifications per community id (only communities with some). */
  byCommunity?: Record<string, number>;
  /** Events happening today that the person confirmed. */
  eventsToday?: number;
};
