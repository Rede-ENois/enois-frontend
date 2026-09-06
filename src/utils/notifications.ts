import type { Notification } from "@/lib/api";
import { texts } from "@/texts";
import type { NotificationTab } from "@/types/components/notification/notification-tab";
import type { NotificationTabConfig } from "@/types/components/notification/notification-tab-config";

export const notificationTabs: Record<NotificationTab, NotificationTabConfig> = {
  new: {
    label: texts.notifications.tabs.new,
    emptyMessage: texts.notifications.emptyNew,
    matches: (notification) => !notification.read,
  },
  history: {
    label: texts.notifications.tabs.history,
    emptyMessage: texts.notifications.emptyHistory,
    matches: (notification) => notification.read,
  },
};

export function getUnreadCount(notifications: Notification[]): number {
  return notifications.reduce(
    (unreadCount, notification) => unreadCount + Number(!notification.read),
    0,
  );
}

export function getNotificationBadge(unreadCount: number, maxVisibleCount = 9): string {
  return unreadCount > maxVisibleCount ? `${maxVisibleCount}+` : String(unreadCount);
}
