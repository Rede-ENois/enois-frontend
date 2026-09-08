import { useNavigate } from "@tanstack/react-router";

import type { Notification } from "@/types/notifications/notification";
import { useNotificationConnectionAction } from "@/utils/notifications/use-notification-connection-action";
import { useNotificationReadActions } from "@/utils/notifications/use-notification-read-actions";
import { navigateToHref } from "@/utils/navigation";

export function useNotificationItemActions(notification: Notification) {
  const navigate = useNavigate();
  const { markAsRead: markNotificationAsRead } = useNotificationReadActions();
  const acceptNotificationConnection = useNotificationConnectionAction();

  const markAsRead = () => {
    if (!notification.read) markNotificationAsRead(notification.id);
  };

  const navigateToNotification = () => {
    markAsRead();
    navigateToHref(notification.href, navigate);
  };

  const acceptConnection = () => {
    if (!notification.actorId) return;
    markAsRead();
    acceptNotificationConnection(notification.actorId);
  };

  return { markAsRead, navigateToNotification, acceptConnection };
}
