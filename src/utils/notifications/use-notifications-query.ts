import { useQuery } from "@tanstack/react-query";

import { listNotifications } from "@/lib/notifications/list-notifications";

export function useNotificationsQuery() {
  return (
    useQuery({
      queryKey: ["notifications"],
      queryFn: () => listNotifications(),
    }).data?.items ?? []
  );
}
