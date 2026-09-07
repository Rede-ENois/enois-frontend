import type { Notification } from "@/types/application/notification/notification";

export type NotificationsPopoverListProps = {
  notifications: Notification[];
  showEmptyState: boolean;
  emptyMessage: string;
  onMarkAsRead: (notificationId: string) => void;
  onAcceptConnection: (actorId: string) => void;
};
