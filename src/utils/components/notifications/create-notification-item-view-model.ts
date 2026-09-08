import { texts } from "@/texts";
import type { Notification } from "@/types/application/notification/notification";
import { notificationMeta } from "@/utils/components/notifications/notification-meta";
import { formatNotificationTime } from "@/utils/notification-time";

export function createNotificationItemViewModel(
  notification: Notification,
  markAsRead: () => void,
  navigateToNotification: () => void,
  acceptConnection: () => void,
) {
  const kind = notification.kind.toLowerCase();
  const meta = notificationMeta[kind] ?? notificationMeta.connection;
  const canAcceptConnection = kind === "connection_request" && Boolean(notification.actorId);
  const cta = canAcceptConnection
    ? {
        label: notification.ctaLabel || texts.notifications.accept,
        run: acceptConnection,
      }
    : notification.ctaLabel
      ? {
          label: notification.ctaLabel,
          run: navigateToNotification,
        }
      : null;

  return {
    Icon: meta.icon,
    iconClassName: meta.className,
    backgroundClassName: notification.read ? "bg-surface-card" : "bg-surface-3",
    title: notification.title.toLowerCase(),
    timeLabel: formatNotificationTime(notification.createdAt),
    showUnread: !notification.read,
    showMarkAsRead: !notification.read,
    markAsRead,
    navigate: navigateToNotification,
    cta,
  };
}
