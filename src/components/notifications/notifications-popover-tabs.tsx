import { useNotificationsPopoverTabsController } from "@/utils/notifications/use-notifications-popover-tabs-controller";

import { cn } from "@/lib/utils";

export function NotificationsPopoverTabs() {
  const tabs = useNotificationsPopoverTabsController();

  return (
    <div className="flex border-b border-border-soft">
      {tabs.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={item.open}
          className={cn(
            item.className,
            item.selected
              ? "border-b-2 border-primary text-primary"
              : "text-text-subtle hover:text-text-strong",
          )}
        >
          <>{item.label}</>

          {item.count !== null && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] text-primary-foreground">
              {item.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
