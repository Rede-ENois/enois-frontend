import { texts } from "@/texts";
import { useNotificationReadActions } from "@/utils/components/notifications/use-notification-read-actions";
import { useNotificationsPopoverContext } from "@/utils/components/notifications/use-notifications-popover-context";
import { CheckCheck } from "lucide-react";

export function NotificationsPopoverHeader() {
  const { showMarkAllAsRead } = useNotificationsPopoverContext();
  const { markAllAsRead } = useNotificationReadActions();

  return (
    <div className="flex items-center justify-between gap-3 border-b border-border-soft px-4 py-3">
      <span className="text-[14px] font-light text-text-strong">{texts.notifications.title}</span>

      {showMarkAllAsRead && (
        <button
          type="button"
          onClick={markAllAsRead}
          className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-light text-text-subtle transition hover:text-primary"
        >
          <CheckCheck className="h-3 w-3" />

          <>{texts.notifications.markAllRead}</>
        </button>
      )}
    </div>
  );
}
