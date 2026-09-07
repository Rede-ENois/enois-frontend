import { useQuery } from "@tanstack/react-query";

import { getConnectionStatus } from "@/lib/api/network/get-connection-status";

export function useProfileConnectionStatus(userId: string, enabled: boolean) {
  const { data } = useQuery({
    queryKey: ["connection-status", userId],
    queryFn: () => getConnectionStatus(userId),
    enabled,
  });

  return data?.status ?? null;
}
