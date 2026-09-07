import { useNavigate } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { NotificationItemProps } from "@/types/components/notification/notification-item-props";
import { navigateToHref } from "@/utils/navigation";
import { formatNotificationTime } from "@/utils/notification-time";
import { notificationMeta } from "@/utils/components/notifications/notification-meta";

export function useNotificationItemController({
  notification,
  onMarkAsRead,
  onAcceptConnection,
}: NotificationItemProps) {
  const navigate = useNavigate();
  const kind = notification.kind.toLowerCase();
  const meta = notificationMeta[kind] ?? notificationMeta.connection;
  const canAcceptConnection = kind === "connection_request" && Boolean(notification.actorId);

  const markAsRead = () => {
    if (!notification.read) onMarkAsRead(notification.id);
  };

  const navigateToNotification = () => {
    markAsRead();
    navigateToHref(notification.href, navigate);
  };

  const acceptConnection = () => {
    if (!notification.actorId) return;
    markAsRead();
    onAcceptConnection(notification.actorId);
  };

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
    meta,
    Icon: meta.icon,
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
