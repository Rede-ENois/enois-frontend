import type { Notification } from "@/types/notifications/notification";
import { createNotificationItemViewModel } from "@/utils/notifications/create-notification-item-view-model";
import { useNotificationItemActions } from "@/utils/notifications/use-notification-item-actions";

export function useNotificationItemController(notification: Notification) {
  const actions = useNotificationItemActions(notification);

  return createNotificationItemViewModel(
    notification,
    actions.markAsRead,
    actions.navigateToNotification,
    actions.acceptConnection,
  );
}
