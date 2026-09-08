import { useNotificationItemContext } from "@/utils/notifications/use-notification-item-context";

import { cn } from "@/lib/utils";

import { NotificationItemActor } from "@/components/notifications/notification-item-actor";
import { NotificationItemContent } from "@/components/notifications/notification-item-content";

export function NotificationItem() {
  const { backgroundClassName } = useNotificationItemContext();

  return (
    <div
      className={cn("border-b border-border-soft px-4 py-3 last:border-b-0", backgroundClassName)}
    >
      <div className="flex items-start gap-3">
        <NotificationItemActor />
        <NotificationItemContent />
      </div>
    </div>
  );
}
