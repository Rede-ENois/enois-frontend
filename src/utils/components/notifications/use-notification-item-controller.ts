import type { NotificationItemProps } from "@/types/components/notification/notification-item-props";

import { createNotificationItemViewModel } from "@/utils/components/notifications/create-notification-item-view-model";
import { useNotificationItemActions } from "@/utils/components/notifications/use-notification-item-actions";

export function useNotificationItemController({ notification }: NotificationItemProps) {
  const actions = useNotificationItemActions(notification);

  return createNotificationItemViewModel(
    notification,
    actions.markAsRead,
    actions.navigateToNotification,
    actions.acceptConnection,
  );
}
