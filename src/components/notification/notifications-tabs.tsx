import { cn } from "@/lib/utils";
import type { NotificationTab } from "@/types/components/notification/notification-tab";
import type { NotificationsTabsProps } from "@/types/components/notification/notifications-tabs-props";
import { notificationTabs } from "@/utils/notifications";

export function NotificationsTabs({ activeTab, unreadCount, onChange }: NotificationsTabsProps) {
  return (
    <div className="flex border-b border-border-soft">
      {(Object.entries(notificationTabs) as [NotificationTab, (typeof notificationTabs)[NotificationTab]][]).map(([key, config]) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 py-2.5 text-[12px] font-light transition",
            activeTab === key
              ? "border-b-2 border-primary text-primary"
              : "text-text-subtle hover:text-text-strong",
          )}
        >
          {config.label}
          {key === "new" && unreadCount > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] text-primary-foreground">
              {unreadCount}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
