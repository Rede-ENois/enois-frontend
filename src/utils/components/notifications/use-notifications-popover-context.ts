import { useContext } from "react";

import { NotificationsPopoverContext } from "@/utils/components/notifications/notifications-popover-context";

export function useNotificationsPopoverContext() {
  const context = useContext(NotificationsPopoverContext);

  if (!context) {
    throw new Error("Notification popover components must be rendered inside NotificationsPopoverProvider");
  }

  return context;
}
