import { useQuery } from "@tanstack/react-query";

import { presenceApi } from "@/lib/api/presence";
import { hasSessionFlag } from "@/lib/session";

export function usePresenceHeartbeat() {
  return useQuery({
    queryKey: ["presence", "heartbeat"],
    queryFn: async () => {
      await presenceApi.heartbeat();
      return true;
    },
    enabled: hasSessionFlag(),
    refetchInterval: 45_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: "always",
    retry: false,
  });
}
