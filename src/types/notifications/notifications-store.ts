import type { NotificationTab } from "@/types/notifications/notification-tab";

export type NotificationsStore = {
  tab: NotificationTab;
  openTab: (tab: NotificationTab) => void;
};
