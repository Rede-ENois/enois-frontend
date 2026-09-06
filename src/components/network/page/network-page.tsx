import { AppContainer } from "@/components/app-container";
import { NetworkMatches } from "@/components/network/network-matches";
import { NetworkOverview } from "@/components/network/network-overview";
import { NetworkPendingRequests } from "@/components/network/network-pending-requests";

import { useNetworkActions } from "./use-network-actions";
import { useNetworkData } from "./use-network-data";

export function NetworkPage() {
  const { users, summary, requestsByDirection } = useNetworkData();
  const actions = useNetworkActions(users);

  return (
    <AppContainer>
      <div className="space-y-6">
        <NetworkOverview summary={summary} suggestionCount={users.length} />
        <NetworkPendingRequests
          incomingRequests={requestsByDirection.incoming}
          outgoingRequests={requestsByDirection.outgoing}
          onAccept={actions.acceptConnectionRequest}
          onCancel={actions.cancelConnectionRequest}
        />
        <NetworkMatches
          matches={actions.matches}
          isConnectionActionPending={actions.isConnectionActionPending}
          onConnect={actions.connectUser}
          onRemove={actions.removeUser}
        />
      </div>
    </AppContainer>
  );
}
