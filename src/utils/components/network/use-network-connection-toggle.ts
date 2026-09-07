import { useNetworkConnectionMutations } from "@/utils/components/network/use-network-connection-mutations";
import { useNetworkLocalConnectionStatus } from "@/utils/components/network/use-network-local-connection-status";

export function useNetworkConnectionToggle() {
  const mutations = useNetworkConnectionMutations();
  const status = useNetworkLocalConnectionStatus();

  return {
    localStatus: status.localStatus,
    pending: mutations.pending,
    toggle: (userId: string, connected: boolean) => {
      if (connected) {
        mutations.remove(userId);
        status.markRemoved(userId);
      } else {
        mutations.connect(userId);
        status.markRequested(userId);
      }
    },
  };
}
