import { texts } from "@/texts";

import { useNetworkRequestsController } from "@/utils/components/network/use-network-requests-controller";

import { RequestCard } from "@/components/network-request-card";

export function NetworkRequests() {
  const {
    incomingRequests,
    outgoingRequests,
    hasRequests,
    hasIncomingRequests,
    hasOutgoingRequests,
    pendingLabel,
    outgoingSectionClassName,
    acceptRequest,
    cancelRequest,
  } = useNetworkRequestsController();

  if (!hasRequests) return null;

  return (
    <section>
      <div className="mb-3">
        <h2 className="text-lg font-semibold">{texts.network.pendingTitle}</h2>

        <p className="text-sm text-muted-foreground">{pendingLabel}</p>
      </div>

      <div className="space-y-3">
        {hasIncomingRequests && (
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

        {hasOutgoingRequests && (
          <>
            <div className={outgoingSectionClassName}>
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
