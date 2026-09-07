import { useQuery } from "@tanstack/react-query";

import { listConnectionRequests } from "@/lib/api/network/list-connection-requests";

export function useNetworkRequestsQuery() {
  const { data } = useQuery({
    queryKey: ["network", "requests"],
    queryFn: () => listConnectionRequests(),
    refetchInterval: 30_000,
  });

  return data?.items ?? [];
}
