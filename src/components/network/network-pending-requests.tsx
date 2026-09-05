import { texts } from "@/texts";

import { NetworkRequestCard } from "./network-request-card";
import type { NetworkRequestItem } from "./network-request-item";

export function PendingRequests({
  incoming,
  outgoing,
  onAccept,
  onCancel,
}: {
  incoming: NetworkRequestItem[];
  outgoing: NetworkRequestItem[];
  onAccept: (userId: string) => void;
  onCancel: (userId: string) => void;
}) {
  const groups = [
    { direction: "incoming" as const, label: texts.network.received, requests: incoming },
    { direction: "outgoing" as const, label: texts.network.sent, requests: outgoing },
  ];
  const total = incoming.length + outgoing.length;

  if (total === 0) return null;

  return (
    <section>
      <div className="mb-3">
        <h2 className="text-lg font-semibold">{texts.network.pendingTitle}</h2>
        <p className="text-sm text-muted-foreground">{texts.network.pendingCount(total)}</p>
      </div>
      <div className="space-y-3">
        {groups.map(({ direction, label, requests }) => {
          if (requests.length === 0) return null;
          return (
            <div
              key={direction}
              className={direction === "outgoing" && incoming.length > 0 ? "pt-3" : ""}
            >
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {label}
              </p>
              <div className="space-y-3">
                {requests.map((item) => (
                  <NetworkRequestCard
                    key={item.request.id}
                    item={item}
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
