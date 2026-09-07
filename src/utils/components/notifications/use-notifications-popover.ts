import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { NotificationTab } from "@/types/components/notification/notification-tab";

import { acceptConnection } from "@/lib/api/network/accept-connection";
import { listNotifications } from "@/lib/api/notifications";
import { markAllNotificationsAsRead } from "@/lib/api/notifications/mark-all-notifications-as-read";
import { markNotificationAsRead } from "@/lib/api/notifications/mark-notification-as-read";

export function useNotificationsPopover() {
  const queryClient = useQueryClient();
  const [notificationTab, setNotificationTab] = useState<NotificationTab>("novas");

  const { data: notificationsData } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => listNotifications(),
  });

  const invalidateNotifications = () =>
    queryClient.invalidateQueries({ queryKey: ["notifications"] });

  const markAsRead = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: invalidateNotifications,
  });

  const markAllAsRead = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: invalidateNotifications,
  });

  const acceptConnectionMutation = useMutation({
    mutationFn: acceptConnection,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["network"] }),
  });

  const notificationList = notificationsData?.items ?? [];
  const unreadCount = notificationList.filter((notification) => !notification.read).length;
  const displayedNotifications = notificationList.filter((notification) =>
    notificationTab === "novas" ? !notification.read : notification.read,
  );
  const hasUnread = unreadCount > 0;
  const showingNew = notificationTab === "novas";

  return {
    notificationTab,
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
    historyTabSelected: notificationTab === "historico",
    newTabCount: hasUnread ? unreadCount : null,
    emptyMessage: showingNew ? texts.notifications.emptyNew : texts.notifications.emptyHistory,
    showEmptyState: displayedNotifications.length === 0,
    openNewTab: () => setNotificationTab("novas"),
    openHistoryTab: () => setNotificationTab("historico"),
    markAsRead: (id: string) => markAsRead.mutate(id),
    markAllAsRead: () => markAllAsRead.mutate(),
    acceptConnection: (actorId: string) => acceptConnectionMutation.mutate(actorId),
  };
}
