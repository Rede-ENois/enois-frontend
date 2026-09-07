import type { Notification } from "@/types/application/notification/notification";

export type NotificationItemContentProps = {
  notification: Notification;
  title: string;
  timeLabel: string;
  showUnread: boolean;
  showMarkAsRead: boolean;
  onMarkAsRead: () => void;
  cta: {
    label: string;
    run: () => void;
  } | null;
};
