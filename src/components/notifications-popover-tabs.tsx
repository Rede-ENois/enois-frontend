import { texts } from "@/texts";
import type { NotificationsPopoverTabsProps } from "@/types/components/notification/notifications-popover-tabs-props";

import { cn } from "@/lib/utils";

export function NotificationsPopoverTabs({
  newSelected,
  historySelected,
  newCount,
  onOpenNew,
  onOpenHistory,
}: NotificationsPopoverTabsProps) {
  const tabs = [
    {
      key: "new",
      label: texts.notifications.tabs.new,
      selected: newSelected,
      onClick: onOpenNew,
      count: newCount,
      className:
        "flex flex-1 items-center justify-center gap-1.5 py-2.5 text-[12px] font-light transition",
    },
    {
      key: "history",
      label: texts.notifications.tabs.history,
      selected: historySelected,
      onClick: onOpenHistory,
      count: null,
      className: "flex-1 py-2.5 text-[12px] font-light transition",
    },
  ];

  return (
    <div className="flex border-b border-border-soft">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={tab.onClick}
          className={cn(
            tab.className,
            tab.selected
              ? "border-b-2 border-primary text-primary"
              : "text-text-subtle hover:text-text-strong",
          )}
        >
          <>{tab.label}</>

          {tab.count !== null && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] text-primary-foreground">
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
