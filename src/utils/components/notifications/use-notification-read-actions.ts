import { useMutation, useQueryClient } from "@tanstack/react-query";

import { markAllNotificationsAsRead } from "@/lib/api/notifications/mark-all-notifications-as-read";
import { markNotificationAsRead } from "@/lib/api/notifications/mark-notification-as-read";

export function useNotificationReadActions() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["notifications"] });
  const markAsRead = useMutation({ mutationFn: markNotificationAsRead, onSuccess: invalidate });
  const markAllAsRead = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: invalidate,
  });

  return {
    markAsRead: (id: string) => markAsRead.mutate(id),
    markAllAsRead: () => markAllAsRead.mutate(),
  };
}
