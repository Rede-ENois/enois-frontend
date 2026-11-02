import type { NotificationModule } from "@/types/application/notification/notification-module";

/** `GET /notifications/unread-summary`: unread notifications per area (only areas with some). */
export type UnreadSummary = {
  total: number;
  byModule: Partial<Record<NotificationModule, number>>;
};
