import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { networkApi, notificationsApi } from "@/lib/api";
import { getUnreadCount, notificationTabs, type NotificationTab } from "@/utils/notifications";
export function useNotificationsPopover() {
  const queryClient = useQueryClient();
  const [notificationTab, setNotificationTab] = useState<NotificationTab>("novas");
  const { data } = useQuery({ queryKey: ["notifications"], queryFn: () => notificationsApi.list() });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["notifications"] });
  const markAsRead = useMutation({ mutationFn: (id: string) => notificationsApi.markAsRead(id), onSuccess: invalidate });
  const markAllAsRead = useMutation({ mutationFn: () => notificationsApi.markAllAsRead(), onSuccess: invalidate });
  const acceptConnection = useMutation({ mutationFn: (actorId: string) => networkApi.accept(actorId), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["network"] }) });
  const notifications = data?.items ?? [];
  const unreadCount = getUnreadCount(notifications);
  const activeTab = notificationTabs[notificationTab];
  return { notificationTab, setNotificationTab, unreadCount, activeTab, displayedNotifications: notifications.filter(activeTab.matches), markAsRead: markAsRead.mutate, markAllAsRead: markAllAsRead.mutate, acceptConnection: acceptConnection.mutate };
}
