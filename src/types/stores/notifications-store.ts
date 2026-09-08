import type { NotificationTab } from "@/types/components/notification/notification-tab";

export type NotificationsStore = {
  tab: NotificationTab;
  openTab: (tab: NotificationTab) => void;
};
