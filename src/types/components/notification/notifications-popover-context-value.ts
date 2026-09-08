import type { Notification } from "@/types/application/notification/notification";

export type NotificationsPopoverContextValue = {
  displayedNotifications: Notification[];
  triggerLabel: string;
  unreadBadgeLabel: string | number | null;
  showMarkAllAsRead: boolean;
  newTabCount: number | null;
  emptyMessage: string;
  showEmptyState: boolean;
};
