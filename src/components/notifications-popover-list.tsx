import { NotificationItem } from "@/components/notification-item";

import { useNotificationsPopoverView } from "@/utils/components/notifications/use-notifications-popover-view";

export function NotificationsPopoverList() {
  const { displayedNotifications, showEmptyState, emptyMessage } = useNotificationsPopoverView();

  return (
    <div className="max-h-[28rem] overflow-y-auto">
      {showEmptyState ? (
        <p className="px-4 py-8 text-center text-[13px] font-light text-text-subtle">
          {emptyMessage}
        </p>
      ) : (
        displayedNotifications.map((notification) => (
          <NotificationItem key={notification.id} notification={notification} />
        ))
      )}
    </div>
  );
}
