import { texts } from "@/texts";
import type { NotificationItemContentProps } from "@/types/components/notification/notification-item-content-props";

export function NotificationItemContent({
  notification,
  title,
  timeLabel,
  showUnread,
  showMarkAsRead,
  onMarkAsRead,
  cta,
}: NotificationItemContentProps) {
  return (
    <div className="min-w-0 flex-1">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[13px] font-light leading-tight text-text-strong">
          {notification.actorName && <span>{notification.actorName} </span>}
          <span className="text-text-subtle">{title}</span>
        </p>

        {showUnread && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />}
      </div>

      <p className="mt-1 break-words text-[13px] font-light leading-snug text-text-subtle">
        {notification.body}
      </p>

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-[11px] font-light text-text-subtle">{timeLabel}</span>

        <div className="flex items-center gap-2">
          {showMarkAsRead && (
            <button
              type="button"
              onClick={onMarkAsRead}
              className="rounded-full px-2 py-1 text-[11px] font-light text-text-subtle transition hover:bg-surface-2 hover:text-text-strong"
            >
              {texts.notifications.markRead}
            </button>
          )}

          {cta && (
            <button
              type="button"
              onClick={cta.run}
              className="rounded-full bg-primary px-3 py-1 text-[11px] font-light text-primary-foreground transition hover:bg-primary/90"
            >
              {cta.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
