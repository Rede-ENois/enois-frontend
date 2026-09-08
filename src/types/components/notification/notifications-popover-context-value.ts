import type { Notification } from "@/types/application/notification/notification";
import type { NotificationTab } from "@/types/components/notification/notification-tab";

export type NotificationsPopoverContextValue = {
  displayedNotifications: Notification[];
  triggerLabel: string;
  unreadBadgeLabel: string | number | null;
  showMarkAllAsRead: boolean;
  newTabSelected: boolean;
  historyTabSelected: boolean;
  newTabCount: number | null;
  emptyMessage: string;
  showEmptyState: boolean;
  openTab: (tab: NotificationTab) => void;
};
