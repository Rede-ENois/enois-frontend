import { useNotificationsPopoverContext } from "@/utils/components/notifications/use-notifications-popover-context";
import { Bell } from "lucide-react";

export function NotificationsPopoverTrigger() {
  const { triggerLabel, unreadBadgeLabel } = useNotificationsPopoverContext();

  return (
    <button
      className="relative grid h-10 w-10 place-items-center rounded-full text-text-subtle transition hover:bg-surface-2 hover:text-primary"
      aria-label={triggerLabel}
    >
      <Bell className="h-5 w-5" />
      {unreadBadgeLabel !== null && (
        <span className="absolute right-1.5 top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[8px] font-medium leading-none text-primary-foreground">
          {unreadBadgeLabel}
        </span>
      )}
    </button>
  );
}
