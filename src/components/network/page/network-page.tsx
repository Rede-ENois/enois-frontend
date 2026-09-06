import { AppContainer } from "@/components/app-container";
import { NetworkMatches } from "@/components/network/network-matches";
import { NetworkOverview } from "@/components/network/network-overview";
import { PendingRequests } from "@/components/network/network-pending-requests";

import { useNetworkActions } from "./use-network-actions";
import { useNetworkData } from "./use-network-data";

export function NetworkPage() {
  const { users, summary, requestGroups } = useNetworkData();
  const actions = useNetworkActions(users);

  return (
    <AppContainer>
      <div className="space-y-6">
        <NetworkOverview summary={summary} suggestionsCount={users.length} />
        <PendingRequests
          incoming={requestGroups.incoming}
          outgoing={requestGroups.outgoing}
          onAccept={actions.acceptRequest}
          onCancel={actions.cancelRequest}
        />
        <NetworkMatches
          items={actions.matchItems}
          isPending={actions.isPending}
          onConnect={actions.connectUser}
          onRemove={actions.removeUser}
        />
      </div>
    </AppContainer>
  );
}
