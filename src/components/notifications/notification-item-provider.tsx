import type { NotificationItemProviderProps } from "@/types/notifications/notification-item-provider-props";
import { NotificationItemContext } from "@/utils/notifications/notification-item-context";
import { useNotificationItemController } from "@/utils/notifications/use-notification-item-controller";

import { NotificationItem } from "@/components/notifications/notification-item";

export function NotificationItemProvider({ notification }: NotificationItemProviderProps) {
  const controller = useNotificationItemController(notification);

  return (
    <NotificationItemContext.Provider value={{ notification, ...controller }}>
      <NotificationItem />
    </NotificationItemContext.Provider>
  );
}
