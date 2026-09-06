import type { Notification } from "@/lib/api";

export type NotificationsListProps = {
  notifications: Notification[];
  emptyMessage: string;
  onMarkAsRead: (id: string) => void;
  onAcceptConnection: (actorId: string) => void;
};
