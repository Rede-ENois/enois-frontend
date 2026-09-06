import { texts } from "@/texts";
import type { NetworkMatchesProps } from "@/types/components/network/network-matches-props";

import { NetworkUserCard } from "./network-user-card";

export function NetworkMatches({
  matches,
  isConnectionActionPending,
  onConnect,
  onRemove,
}: NetworkMatchesProps) {
  return (
    <section>
      <div className="mb-3 flex items-end justify-between">
        <div>
          <h2 className="text-lg font-semibold">{texts.network.matchesTitle}</h2>
          <p className="text-sm text-muted-foreground">{texts.network.matchesDescription}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {matches.map(({ user, connectionState }) => (
          <NetworkUserCard
            key={user.id}
            user={user}
            connectionState={connectionState}
            isConnectionActionPending={isConnectionActionPending}
            onConnect={onConnect}
            onRemove={onRemove}
          />
        ))}
      </div>
    </section>
  );
}
