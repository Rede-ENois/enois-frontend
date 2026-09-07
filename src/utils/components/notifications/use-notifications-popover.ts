import { useState } from "react";

import type { NotificationTab } from "@/types/components/notification/notification-tab";

import { createNotificationsPopoverViewModel } from "@/utils/components/notifications/create-notifications-popover-view-model";
import { useNotificationConnectionAction } from "@/utils/components/notifications/use-notification-connection-action";
import { useNotificationReadActions } from "@/utils/components/notifications/use-notification-read-actions";
import { useNotificationsQuery } from "@/utils/components/notifications/use-notifications-query";

export function useNotificationsPopover() {
  const [notificationTab, setNotificationTab] = useState<NotificationTab>("novas");
  const notifications = useNotificationsQuery();
  const readActions = useNotificationReadActions();
  const acceptConnection = useNotificationConnectionAction();
  const view = createNotificationsPopoverViewModel(notifications, notificationTab);

  return {
    notificationTab,
    ...view,
    openNewTab: () => setNotificationTab("novas"),
    openHistoryTab: () => setNotificationTab("historico"),
    markAsRead: readActions.markAsRead,
    markAllAsRead: readActions.markAllAsRead,
    acceptConnection,
  };
}
