import type { ElementType } from "react";

import type { Notification } from "@/types/application/notification/notification";

export type NotificationItemActorProps = {
  notification: Notification;
  Icon: ElementType;
  iconClassName: string;
  onNavigate: () => void;
};
