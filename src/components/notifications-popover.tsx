import { Root as Popover, Trigger as PopoverTrigger } from "@radix-ui/react-popover";

import { Bell, CheckCheck } from "lucide-react";

import { cn } from "@/lib/utils";
import { useNotificationsPopover } from "@/lib/use-notifications-popover";
import { texts } from "@/texts";

import { NotificationItem } from "@/components/notification-item";
import { PopoverContent } from "@/components/ui/popover-content";

export function NotificationsPopover() {
  const notifications = useNotificationsPopover();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="relative grid h-10 w-10 place-items-center rounded-full text-text-subtle transition hover:bg-surface-2 hover:text-primary"
          aria-label={
            notifications.unreadCount > 0
              ? texts.notifications.unreadLabel(notifications.unreadCount)
              : texts.notifications.title
          }
        >
          <Bell className="h-5 w-5" />
          {notifications.unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[8px] font-medium leading-none text-primary-foreground">
              {notifications.unreadCount > 9
                ? texts.notifications.overflowCount
                : notifications.unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-[min(calc(100vw-2rem),24rem)] overflow-hidden rounded-2xl border-border-soft bg-surface-card p-0 shadow-card"
      >
        <div className="flex items-center justify-between gap-3 border-b border-border-soft px-4 py-3">
          <span className="text-[14px] font-light text-text-strong">{texts.notifications.title}</span>
          {notifications.unreadCount > 0 && notifications.notificationTab === "novas" && (
            <button
              type="button"
              onClick={notifications.markAllAsRead}
              className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-light text-text-subtle transition hover:text-primary"
            >
              <CheckCheck className="h-3 w-3" />
              <>{texts.notifications.markAllRead}</>
            </button>
          )}
        </div>

        <div className="flex border-b border-border-soft">
          <button
            type="button"
            onClick={() => notifications.setNotificationTab("novas")}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 py-2.5 text-[12px] font-light transition",
              notifications.notificationTab === "novas"
                ? "border-b-2 border-primary text-primary"
                : "text-text-subtle hover:text-text-strong",
            )}
          >
            <>{texts.notifications.tabs.new}</>
            {notifications.unreadCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] text-primary-foreground">
                {notifications.unreadCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => notifications.setNotificationTab("historico")}
            className={cn(
              "flex-1 py-2.5 text-[12px] font-light transition",
              notifications.notificationTab === "historico"
                ? "border-b-2 border-primary text-primary"
                : "text-text-subtle hover:text-text-strong",
            )}
          >
            {texts.notifications.tabs.history}
          </button>
        </div>

        <div className="max-h-[28rem] overflow-y-auto">
          {notifications.displayedNotifications.length === 0 ? (
            <p className="px-4 py-8 text-center text-[13px] font-light text-text-subtle">
              {notifications.notificationTab === "novas"
                ? texts.notifications.emptyNew
                : texts.notifications.emptyHistory}
            </p>
          ) : (
            notifications.displayedNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={notifications.markAsRead}
                onAcceptConnection={notifications.acceptConnection}
              />
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
