import { NotificationsPopoverContext } from "@/utils/notifications/notifications-popover-context";
import { useNotificationsPopoverView } from "@/utils/notifications/use-notifications-popover-view";

import { NotificationsPopover } from "@/components/notifications/notifications-popover";

export function NotificationsPopoverProvider() {
  const view = useNotificationsPopoverView();

  return (
    <NotificationsPopoverContext.Provider value={view}>
      <NotificationsPopover />
    </NotificationsPopoverContext.Provider>
  );
}
