import { texts } from "@/texts";
import { useNetworkRequestsController } from "@/utils/components/network/use-network-requests-controller";

import { NetworkRequestSection } from "@/components/network-request-section";

export function NetworkRequests() {
  const controller = useNetworkRequestsController();

  if (!controller.hasRequests) return null;

  return (
    <section>
      <header className="mb-3">
        <h2 className="text-lg font-semibold">{texts.network.pendingTitle}</h2>

        <p className="text-sm text-muted-foreground">{controller.pendingLabel}</p>
      </header>

      <div className="space-y-3">
        {controller.hasIncomingRequests && (
          <NetworkRequestSection label={texts.network.received} requests={controller.incomingRequests} />
        )}
        {controller.hasOutgoingRequests && (
          <NetworkRequestSection
            label={texts.network.sent}
            labelClassName={controller.outgoingSectionClassName}
            requests={controller.outgoingRequests}
          />
        )}
      </div>
    </section>
  );
}
