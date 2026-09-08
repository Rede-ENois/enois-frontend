import type { NotificationItemProps } from "@/types/components/notification/notification-item-props";
import { createNotificationItemViewModel } from "@/utils/components/notifications/create-notification-item-view-model";
import { useNotificationItemActions } from "@/utils/components/notifications/use-notification-item-actions";

export function useNotificationItemController(props: NotificationItemProps) {
  const actions = useNotificationItemActions(props);

  return createNotificationItemViewModel(
    props.notification,
    actions.markAsRead,
    actions.navigateToNotification,
    actions.acceptConnection,
  );
}
