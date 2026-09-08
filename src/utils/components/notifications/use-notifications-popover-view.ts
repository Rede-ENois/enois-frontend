import { useNotificationsStore } from "@/stores/notifications.store";

import { createNotificationsPopoverViewModel } from "@/utils/components/notifications/create-notifications-popover-view-model";
import { useNotificationsQuery } from "@/utils/components/notifications/use-notifications-query";

export function useNotificationsPopoverView() {
  const tab = useNotificationsStore((state) => state.tab);
  const openTab = useNotificationsStore((state) => state.openTab);
  const notifications = useNotificationsQuery();

  return {
    ...createNotificationsPopoverViewModel(notifications, tab),
    openTab,
  };
}
