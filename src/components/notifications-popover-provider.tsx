import { NotificationsPopoverContext } from "@/utils/components/notifications/notifications-popover-context";
import { useNotificationsPopoverView } from "@/utils/components/notifications/use-notifications-popover-view";

import { NotificationsPopover } from "@/components/notifications-popover";

export function NotificationsPopoverProvider() {
  const view = useNotificationsPopoverView();

  return (
    <NotificationsPopoverContext.Provider value={view}>
      <NotificationsPopover />
    </NotificationsPopoverContext.Provider>
  );
}
