import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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

  return {
    notificationTab,
    setNotificationTab,
    unreadCount,
    displayedNotifications,
    markAsRead: (id: string) => markAsRead.mutate(id),
    markAllAsRead: () => markAllAsRead.mutate(),
    acceptConnection: (actorId: string) => acceptConnectionMutation.mutate(actorId),
  };
}
