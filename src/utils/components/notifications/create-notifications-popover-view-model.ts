import { texts } from "@/texts";
import type { Notification } from "@/types/application/notification/notification";
import type { NotificationTab } from "@/types/components/notification/notification-tab";

export function createNotificationsPopoverViewModel(
  notifications: Notification[],
  tab: NotificationTab,
) {
  const unreadCount = notifications.filter((notification) => !notification.read).length;
  const displayedNotifications = notifications.filter((notification) =>
    tab === "novas" ? !notification.read : notification.read,
  );
  const hasUnread = unreadCount > 0;
  const showingNew = tab === "novas";

  return {
    unreadCount,
    displayedNotifications,
    triggerLabel: hasUnread
      ? texts.notifications.unreadLabel(unreadCount)
      : texts.notifications.title,
    unreadBadgeLabel: hasUnread
      ? unreadCount > 9
        ? texts.notifications.overflowCount
        : unreadCount
      : null,
    showMarkAllAsRead: hasUnread && showingNew,
    newTabSelected: showingNew,
    historyTabSelected: tab === "historico",
    newTabCount: hasUnread ? unreadCount : null,
    emptyMessage: showingNew ? texts.notifications.emptyNew : texts.notifications.emptyHistory,
    showEmptyState: displayedNotifications.length === 0,
  };
}
