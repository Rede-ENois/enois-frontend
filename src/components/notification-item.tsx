import { texts } from "@/texts";
import type { NotificationItemProps } from "@/types/components/notification/notification-item-props";

import { useNotificationItemController } from "@/utils/components/notifications/use-notification-item-controller";

import { cn } from "@/lib/utils";

export function NotificationItem(props: NotificationItemProps) {
  const { notification } = props;
  const {
    meta,
    Icon,
    backgroundClassName,
    title,
    timeLabel,
    showUnread,
    showMarkAsRead,
    markAsRead,
    navigate,
    cta,
  } = useNotificationItemController(props);

  return (
    <div
      className={cn(
        "border-b border-border-soft px-4 py-3 last:border-b-0",
        backgroundClassName,
      )}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={navigate}
          className="shrink-0 rounded-full transition hover:opacity-80"
        >
          {notification.actorAvatar ? (
            <img
              src={notification.actorAvatar}
              alt={notification.actorName ?? ""}
              className="h-9 w-9 rounded-full object-cover"
            />
          ) : (
            <span className={cn("grid h-9 w-9 place-items-center rounded-full", meta.className)}>
              <Icon className="h-4 w-4" />
            </span>
          )}
        </button>

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
                  onClick={markAsRead}
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
      </div>
    </div>
  );
}
