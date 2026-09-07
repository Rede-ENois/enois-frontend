import type { NotificationsPopoverListProps } from "@/types/components/notification/notifications-popover-list-props";

import { NotificationItem } from "@/components/notification-item";

export function NotificationsPopoverList({
  notifications,
  showEmptyState,
  emptyMessage,
  onMarkAsRead,
  onAcceptConnection,
}: NotificationsPopoverListProps) {
  return (
    <div className="max-h-[28rem] overflow-y-auto">
      {showEmptyState ? (
        <p className="px-4 py-8 text-center text-[13px] font-light text-text-subtle">
          {emptyMessage}
        </p>
      ) : (
        notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onMarkAsRead={onMarkAsRead}
            onAcceptConnection={onAcceptConnection}
          />
        ))
      )}
    </div>
  );
}
