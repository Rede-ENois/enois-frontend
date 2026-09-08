import { useNavigate } from "@tanstack/react-router";

import type { Notification } from "@/types/application/notification/notification";

import { navigateToHref } from "@/utils/navigation";

import { useNotificationConnectionAction } from "@/utils/components/notifications/use-notification-connection-action";
import { useNotificationReadActions } from "@/utils/components/notifications/use-notification-read-actions";

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
