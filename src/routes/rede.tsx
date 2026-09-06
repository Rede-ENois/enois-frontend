import { createFileRoute } from "@tanstack/react-router";

import { requireAuth } from "@/lib/require-auth";
import { texts } from "@/texts";

import { AppContainer } from "@/components/app-container";
import { NetworkMatches } from "@/components/network-matches";
import { NetworkRequests } from "@/components/network-requests";
import { NetworkSummary } from "@/components/network-summary";

export const Route = createFileRoute("/rede")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: texts.network.seoTitle }] }),
  component: Rede,
});

function Rede() {
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
