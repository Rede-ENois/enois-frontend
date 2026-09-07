import { texts } from "@/texts";

import { useNetworkRequestsController } from "@/lib/use-network-requests-controller";

import { RequestCard } from "@/components/network-request-card";

export function NetworkRequests() {
  const { incomingRequests, outgoingRequests, acceptRequest, cancelRequest } =
    useNetworkRequestsController();

  if (incomingRequests.length === 0 && outgoingRequests.length === 0) return null;

  return (
    <section>
      <div className="mb-3">
        <h2 className="text-lg font-semibold">{texts.network.pendingTitle}</h2>

        <p className="text-sm text-muted-foreground">
          {texts.network.pendingCount(incomingRequests.length + outgoingRequests.length)}
        </p>
      </div>

      <div className="space-y-3">
        {incomingRequests.length > 0 && (
          <>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {texts.network.received}
            </p>
            {incomingRequests.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                onAccept={acceptRequest}
                onCancel={cancelRequest}
              />
            ))}
          </>
        )}

        {outgoingRequests.length > 0 && (
          <>
            <div className={incomingRequests.length > 0 ? "pt-3" : ""}>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {texts.network.sent}
              </p>
            </div>
            {outgoingRequests.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                onAccept={acceptRequest}
                onCancel={cancelRequest}
              />
            ))}
          </>
        )}
      </div>
    </section>
  );
}
