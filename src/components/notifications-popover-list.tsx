import { useNotificationsPopoverContext } from "@/utils/components/notifications/use-notifications-popover-context";

import { NotificationItemProvider } from "@/components/notification-item-provider";

export function NotificationsPopoverList() {
  const { displayedNotifications, showEmptyState, emptyMessage } =
    useNotificationsPopoverContext();

  return (
    <div className="max-h-[28rem] overflow-y-auto">
      {showEmptyState ? (
        <p className="px-4 py-8 text-center text-[13px] font-light text-text-subtle">
          {emptyMessage}
        </p>
      ) : (
        displayedNotifications.map((notification) => (
          <NotificationItemProvider key={notification.id} notification={notification} />
        ))
      )}
    </div>
  );
}
