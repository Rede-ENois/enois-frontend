import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { networkApi, notificationApi } from "@/lib/api";
import type { NotificationTab } from "@/types/components/notification/notification-tab";
import { getUnreadCount, notificationTabs } from "@/utils/notifications";

export function useNotificationsPopover() {
  const queryClient = useQueryClient();
  const [notificationTab, setNotificationTab] = useState<NotificationTab>("new");
  const { data: notificationsData } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationApi.list(),
  });
  const invalidateNotifications = () =>
    queryClient.invalidateQueries({ queryKey: ["notifications"] });

  const markNotificationReadMutation = useMutation({
    mutationFn: (notificationId: string) => notificationApi.markRead(notificationId),
    onSuccess: invalidateNotifications,
  });
  const markAllNotificationsReadMutation = useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onSuccess: invalidateNotifications,
  });
  const acceptConnectionRequestMutation = useMutation({
    mutationFn: (actorId: string) => networkApi.acceptConnectionRequest(actorId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["network"] }),
  });

  const notifications = notificationsData?.items ?? [];
  const unreadCount = getUnreadCount(notifications);
  const activeTab = notificationTabs[notificationTab];

  return {
    notificationTab,
    setNotificationTab,
    unreadCount,
    activeTab,
    displayedNotifications: notifications.filter(activeTab.matches),
    markAsRead: markNotificationReadMutation.mutate,
    markAllAsRead: markAllNotificationsReadMutation.mutate,
    acceptConnection: acceptConnectionRequestMutation.mutate,
  };
}
