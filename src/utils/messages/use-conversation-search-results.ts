import { useQuery } from "@tanstack/react-query";

import { listNetworkUsers } from "@/lib/api/network";
import { getCurrentUserId } from "@/lib/get-current-user-id";

export function useConversationSearchResults(searchQuery: string) {
  const currentUserId = getCurrentUserId();
  const { data } = useQuery({
    queryKey: ["network", "users", searchQuery],
    queryFn: () => listNetworkUsers(searchQuery),
    enabled: searchQuery.length > 0,
  });

  return (data?.items ?? []).filter((user) => user.id !== currentUserId);
}
