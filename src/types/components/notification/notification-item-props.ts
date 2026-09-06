import type { Notification } from "@/lib/api";

export type NotificationItemProps = {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onAcceptConnection: (actorId: string) => void;
};
