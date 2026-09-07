import { Root as Popover, Trigger as PopoverTrigger } from "@radix-ui/react-popover";

import { useNotificationsPopover } from "@/utils/components/notifications/use-notifications-popover";

import { PopoverContent } from "@/components/ui/popover-content";

import { NotificationsPopoverHeader } from "@/components/notifications-popover-header";
import { NotificationsPopoverList } from "@/components/notifications-popover-list";
import { NotificationsPopoverTabs } from "@/components/notifications-popover-tabs";
import { NotificationsPopoverTrigger } from "@/components/notifications-popover-trigger";

export function NotificationsPopover() {
  const notifications = useNotificationsPopover();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <NotificationsPopoverTrigger
          label={notifications.triggerLabel}
          unreadBadgeLabel={notifications.unreadBadgeLabel}
        />
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-[min(calc(100vw-2rem),24rem)] overflow-hidden rounded-2xl border-border-soft bg-surface-card p-0 shadow-card"
      >
        <NotificationsPopoverHeader
          showMarkAllAsRead={notifications.showMarkAllAsRead}
          onMarkAllAsRead={notifications.markAllAsRead}
        />
        <NotificationsPopoverTabs
          newSelected={notifications.newTabSelected}
          historySelected={notifications.historyTabSelected}
          newCount={notifications.newTabCount}
          onOpenNew={notifications.openNewTab}
          onOpenHistory={notifications.openHistoryTab}
        />
        <NotificationsPopoverList
          notifications={notifications.displayedNotifications}
          showEmptyState={notifications.showEmptyState}
          emptyMessage={notifications.emptyMessage}
          onMarkAsRead={notifications.markAsRead}
          onAcceptConnection={notifications.acceptConnection}
        />
      </PopoverContent>
    </Popover>
  );
}
