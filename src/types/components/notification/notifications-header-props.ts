import type { NotificationTab } from "./notification-tab";

export type NotificationsHeaderProps = {
  unreadCount: number;
  notificationTab: NotificationTab;
  onMarkAllRead: () => void;
};
