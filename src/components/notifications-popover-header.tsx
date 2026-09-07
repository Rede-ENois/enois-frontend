import { CheckCheck } from "lucide-react";

import { texts } from "@/texts";
import type { NotificationsPopoverHeaderProps } from "@/types/components/notification/notifications-popover-header-props";

export function NotificationsPopoverHeader({
  showMarkAllAsRead,
  onMarkAllAsRead,
}: NotificationsPopoverHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border-soft px-4 py-3">
      <span className="text-[14px] font-light text-text-strong">{texts.notifications.title}</span>

      {showMarkAllAsRead && (
        <button
          type="button"
          onClick={onMarkAllAsRead}
          className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-light text-text-subtle transition hover:text-primary"
        >
          <CheckCheck className="h-3 w-3" />

          <>{texts.notifications.markAllRead}</>
        </button>
      )}
    </div>
  );
}
