import { useNavigate } from "@tanstack/react-router";

import type { NotificationItemProps } from "@/types/components/notification/notification-item-props";
import { navigateToHref } from "@/utils/navigation";

export function useNotificationItemActions({
  notification,
  onMarkAsRead,
  onAcceptConnection,
}: NotificationItemProps) {
  const navigate = useNavigate();

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

  return { markAsRead, navigateToNotification, acceptConnection };
}
