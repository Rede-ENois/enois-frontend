import type { Notification } from "@/lib/api";
import { texts } from "@/texts";

export type NotificationTab = "novas" | "historico";

export const notificationTabs: Record<
  NotificationTab,
  {
    label: string;
    emptyMessage: string;
    matches: (notification: Notification) => boolean;
  }
> = {
  novas: {
    label: texts.notifications.tabs.new,
    emptyMessage: texts.notifications.emptyNew,
    matches: (notification) => !notification.read,
  },
  historico: {
    label: texts.notifications.tabs.history,
    emptyMessage: texts.notifications.emptyHistory,
    matches: (notification) => notification.read,
  },
};

export function getUnreadCount(notifications: Notification[]): number {
  return notifications.reduce((count, notification) => count + Number(!notification.read), 0);
}

export function getNotificationBadge(count: number, max = 9): string {
  return count > max ? `${max}+` : String(count);
}
