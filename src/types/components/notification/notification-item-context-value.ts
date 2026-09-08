import type { ElementType } from "react";

import type { Notification } from "@/types/application/notification/notification";
import type { NotificationItemCta } from "@/types/components/notification/notification-item-cta";

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
