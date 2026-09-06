import { texts } from "@/texts";
import type { NetworkPendingRequestsProps } from "@/types/components/network/network-pending-requests-props";

import { NetworkRequestCard } from "./network-request-card";

export function NetworkPendingRequests({
  incomingRequests,
  outgoingRequests,
  onAccept,
  onCancel,
}: NetworkPendingRequestsProps) {
  const groups = [
    { direction: "incoming" as const, label: texts.network.received, requests: incomingRequests },
    { direction: "outgoing" as const, label: texts.network.sent, requests: outgoingRequests },
  ];
  const totalRequestCount = incomingRequests.length + outgoingRequests.length;

  if (totalRequestCount === 0) return null;

  return (
    <section>
      <div className="mb-3">
        <h2 className="text-lg font-semibold">{texts.network.pendingTitle}</h2>
        <p className="text-sm text-muted-foreground">
          {texts.network.pendingCount(totalRequestCount)}
        </p>
      </div>
      <div className="space-y-3">
        {groups.map(({ direction, label, requests }) => {
          if (requests.length === 0) return null;
          return (
            <div
              key={direction}
              className={direction === "outgoing" && incomingRequests.length > 0 ? "pt-3" : ""}
            >
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {label}
              </p>
              <div className="space-y-3">
                {requests.map((requestViewModel) => (
                  <NetworkRequestCard
                    key={requestViewModel.request.id}
                    requestViewModel={requestViewModel}
                    onAccept={onAccept}
                    onCancel={onCancel}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
