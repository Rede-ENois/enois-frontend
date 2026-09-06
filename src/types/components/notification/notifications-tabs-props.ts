import type { NotificationTab } from "./notification-tab";

export type NotificationsTabsProps = {
  activeTab: NotificationTab;
  unreadCount: number;
  onChange: (tab: NotificationTab) => void;
};
