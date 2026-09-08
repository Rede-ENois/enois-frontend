import type { ElementType } from "react";

import type { Notification } from "@/types/notifications/notification";
import type { NotificationItemCta } from "@/types/notifications/notification-item-cta";

export type NotificationItemContextValue = {
  notification: Notification;
  Icon: ElementType;
  iconClassName: string;
  backgroundClassName: string;
  title: string;
  timeLabel: string;
  showUnread: boolean;
  showMarkAsRead: boolean;
  markAsRead: () => void;
  navigate: () => void;
  cta: NotificationItemCta | null;
};
