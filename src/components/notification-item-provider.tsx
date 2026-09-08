import type { NotificationItemProviderProps } from "@/types/components/notification/notification-item-provider-props";
import { NotificationItemContext } from "@/utils/components/notifications/notification-item-context";
import { useNotificationItemController } from "@/utils/components/notifications/use-notification-item-controller";

import { NotificationItem } from "@/components/notification-item";

export function NotificationItemProvider({ notification }: NotificationItemProviderProps) {
  const controller = useNotificationItemController(notification);

  return (
    <NotificationItemContext.Provider value={{ notification, ...controller }}>
      <NotificationItem />
    </NotificationItemContext.Provider>
  );
}
