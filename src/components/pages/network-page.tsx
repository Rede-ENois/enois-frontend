import { AppContainer } from "@/components/layout/app-container";
import { NetworkMatches } from "@/components/network-matches";
import { NetworkRequests } from "@/components/network-requests";
import { NetworkSummary } from "@/components/network-summary";

export function Rede() {
  return (
    <AppContainer>
      <div className="space-y-6">
        <NetworkSummary />
        <NetworkRequests />
        <NetworkMatches />
      </div>
    </AppContainer>
  );
}
