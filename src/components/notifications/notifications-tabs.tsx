import { cn } from "@/lib/utils";
import { notificationTabs, type NotificationTab } from "@/utils/notifications";
export function NotificationsTabs({ activeTab, unreadCount, onChange }: { activeTab: NotificationTab; unreadCount: number; onChange: (tab: NotificationTab) => void }) {
  return <div className="flex border-b border-border-soft">{(Object.entries(notificationTabs) as [NotificationTab, (typeof notificationTabs)[NotificationTab]][]).map(([key, config]) => <button key={key} type="button" onClick={() => onChange(key)} className={cn("flex flex-1 items-center justify-center gap-1.5 py-2.5 text-[12px] font-light transition", activeTab === key ? "border-b-2 border-primary text-primary" : "text-text-subtle hover:text-text-strong")}>{config.label}{key === "novas" && unreadCount > 0 && <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] text-primary-foreground">{unreadCount}</span>}</button>)}</div>;
}
