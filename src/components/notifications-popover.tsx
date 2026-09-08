import { Root as Popover, Trigger as PopoverTrigger } from "@radix-ui/react-popover";

import { PopoverContent } from "@/components/ui/popover-content";

import { NotificationsPopoverHeader } from "@/components/notifications-popover-header";
import { NotificationsPopoverList } from "@/components/notifications-popover-list";
import { NotificationsPopoverTabs } from "@/components/notifications-popover-tabs";
import { NotificationsPopoverTrigger } from "@/components/notifications-popover-trigger";

export function NotificationsPopover() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <NotificationsPopoverTrigger />
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-[min(calc(100vw-2rem),24rem)] overflow-hidden rounded-2xl border-border-soft bg-surface-card p-0 shadow-card"
      >
        <NotificationsPopoverHeader />
        <NotificationsPopoverTabs />
        <NotificationsPopoverList />
      </PopoverContent>
    </Popover>
  );
}
