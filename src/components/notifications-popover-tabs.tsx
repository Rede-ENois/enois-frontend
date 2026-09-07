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
  return (
    <div className="flex border-b border-border-soft">
      <button
        type="button"
        onClick={onOpenNew}
        className={cn(
          "flex flex-1 items-center justify-center gap-1.5 py-2.5 text-[12px] font-light transition",
          newSelected
            ? "border-b-2 border-primary text-primary"
            : "text-text-subtle hover:text-text-strong",
        )}
      >
        <>{texts.notifications.tabs.new}</>
        {newCount !== null && (
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] text-primary-foreground">
            {newCount}
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={onOpenHistory}
        className={cn(
          "flex-1 py-2.5 text-[12px] font-light transition",
          historySelected
            ? "border-b-2 border-primary text-primary"
            : "text-text-subtle hover:text-text-strong",
        )}
      >
        {texts.notifications.tabs.history}
      </button>
    </div>
  );
}
