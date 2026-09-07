import { useQuery } from "@tanstack/react-query";

import { listNetworkUsers } from "@/lib/api/network";

import { createNetworkMatchViewModel } from "@/utils/components/network/create-network-match-view-model";
import { useNetworkConnectionToggle } from "@/utils/components/network/use-network-connection-toggle";

export function useNetworkMatchesController() {
  const { data } = useQuery({
    queryKey: ["network", "users"],
    queryFn: () => listNetworkUsers(),
  });
  const connection = useNetworkConnectionToggle();

  return {
    users: (data?.items ?? []).map((user) =>
      createNetworkMatchViewModel(
        user,
        connection.localStatus[user.id],
        connection.pending,
        connection.toggle,
      ),
    ),
  };
}
