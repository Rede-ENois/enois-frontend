import { NOTIFICATION_TABS } from "@/constants/components/notifications/notification-tabs";
import { useNotificationsStore } from "@/stores/notifications.store";

import { cn } from "@/lib/utils";

import { useNotificationsPopoverView } from "@/utils/components/notifications/use-notifications-popover-view";

export function NotificationsPopoverTabs() {
  const tab = useNotificationsStore((state) => state.tab);
  const openTab = useNotificationsStore((state) => state.openTab);
  const { newTabCount } = useNotificationsPopoverView();

  return (
    <div className="flex border-b border-border-soft">
      {NOTIFICATION_TABS.map((item) => {
        const selected = tab === item.key;
        const count = item.key === "novas" ? newTabCount : null;

        return (
          <button
            key={item.key}
            type="button"
            onClick={() => openTab(item.key)}
            className={cn(
              item.className,
              selected
                ? "border-b-2 border-primary text-primary"
                : "text-text-subtle hover:text-text-strong",
            )}
          >
            <>{item.label}</>

            {count !== null && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] text-primary-foreground">
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
