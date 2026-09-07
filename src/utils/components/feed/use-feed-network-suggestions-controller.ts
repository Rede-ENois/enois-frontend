import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { connectToUser } from "@/lib/api/network/connect-to-user";
import { listNetworkSuggestions } from "@/lib/api/network/list-network-suggestions";

export function useFeedNetworkSuggestionsController() {
  const queryClient = useQueryClient();
  const { data: suggestions } = useQuery({
    queryKey: ["network", "suggestions"],
    queryFn: () => listNetworkSuggestions(4),
  });
  const connect = useMutation({
    mutationFn: connectToUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["network", "suggestions"] }),
  });
  const items = suggestions ?? [];

  return {
    visible: items.length > 0,
    items: items.map((user) => ({
      user,
      connect: () => connect.mutate(user.id),
      connecting: connect.isPending,
    })),
  };
}
