import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { NotificationsHeader } from "./notifications-header";
import { NotificationsList } from "./notifications-list";
import { NotificationsTabs } from "./notifications-tabs";
import { NotificationsTrigger } from "./notifications-trigger";
import { useNotificationsPopover } from "./use-notifications-popover";
export function NotificationsPopover() {
  const state = useNotificationsPopover();
  return <Popover><PopoverTrigger asChild><NotificationsTrigger unreadCount={state.unreadCount} /></PopoverTrigger><PopoverContent align="end" className="w-[min(calc(100vw-2rem),24rem)] overflow-hidden rounded-2xl border-border-soft bg-surface-card p-0 shadow-card"><NotificationsHeader unreadCount={state.unreadCount} notificationTab={state.notificationTab} onMarkAllRead={state.markAllAsRead} /><NotificationsTabs activeTab={state.notificationTab} unreadCount={state.unreadCount} onChange={state.setNotificationTab} /><NotificationsList notifications={state.displayedNotifications} emptyMessage={state.activeTab.emptyMessage} onMarkAsRead={state.markAsRead} onAcceptConnection={state.acceptConnection} /></PopoverContent></Popover>;
}
