import type { NotificationItemProps } from "@/types/components/notification/notification-item-props";
import { useNotificationItemController } from "@/utils/components/notifications/use-notification-item-controller";

import { cn } from "@/lib/utils";

import { NotificationItemActor } from "@/components/notification-item-actor";
import { NotificationItemContent } from "@/components/notification-item-content";

export function NotificationItem(props: NotificationItemProps) {
  const { notification } = props;
  const controller = useNotificationItemController(props);

  return (
    <div
      className={cn(
        "border-b border-border-soft px-4 py-3 last:border-b-0",
        controller.backgroundClassName,
      )}
    >
      <div className="flex items-start gap-3">
        <NotificationItemActor
          notification={notification}
          Icon={controller.Icon}
          iconClassName={controller.meta.className}
          onNavigate={controller.navigate}
        />
        <NotificationItemContent
          notification={notification}
          title={controller.title}
          timeLabel={controller.timeLabel}
          showUnread={controller.showUnread}
          showMarkAsRead={controller.showMarkAsRead}
          onMarkAsRead={controller.markAsRead}
          cta={controller.cta}
        />
      </div>
    </div>
  );
}
