import { NOTIFICATION_TABS } from "@/constants/components/notifications/notification-tabs";
import { useNotificationsPopoverContext } from "@/utils/components/notifications/use-notifications-popover-context";

export function useNotificationsPopoverTabsController() {
  const { newTabSelected, historyTabSelected, newTabCount, openTab } =
    useNotificationsPopoverContext();

  return NOTIFICATION_TABS.map((item) => ({
    ...item,
    selected: item.key === "novas" ? newTabSelected : historyTabSelected,
    count: item.key === "novas" ? newTabCount : null,
    open: () => openTab(item.key),
  }));
}
