import { useQuery } from "@tanstack/react-query";

import { texts } from "@/texts";

import { listNetworkUsers } from "@/lib/api/network";
import { getNetworkSummary } from "@/lib/api/network/get-network-summary";

export function useNetworkSummaryController() {
  const { data: summary } = useQuery({
    queryKey: ["network", "summary"],
    queryFn: getNetworkSummary,
  });
  const { data: usersData } = useQuery({
    queryKey: ["network", "users"],
    queryFn: () => listNetworkUsers(),
  });

  return {
    stats: [
      { key: "connections", label: texts.network.stats.connections, value: String(summary?.connections ?? 0) },
      { key: "following", label: texts.network.stats.following, value: String(summary?.followers ?? 0) },
      { key: "requests", label: texts.network.stats.requests, value: String(summary?.pendingRequests ?? 0), highlight: true },
      { key: "suggestions", label: texts.network.stats.suggestions, value: String(usersData?.items.length ?? 0) },
    ],
  };
}
