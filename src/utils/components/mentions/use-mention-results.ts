import { useQuery } from "@tanstack/react-query";

import { searchUsers } from "@/lib/api/users";

export function useMentionResults(query: string) {
  return useQuery({
    queryKey: ["users", "search", query],
    queryFn: () => searchUsers(query),
    enabled: query.length >= 2,
  }).data ?? [];
}
