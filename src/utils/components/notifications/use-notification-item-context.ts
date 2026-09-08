import { useContext } from "react";

import { NotificationItemContext } from "@/utils/components/notifications/notification-item-context";

export function useNotificationItemContext() {
  const context = useContext(NotificationItemContext);

  if (!context) {
    throw new Error("Notification item components must be rendered inside NotificationItemProvider");
  }

  return context;
}
