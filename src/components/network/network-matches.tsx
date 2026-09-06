import { texts } from "@/texts";

import type { NetworkMatchItem } from "./network-match-item";
import { NetworkUserCard } from "./network-user-card";

type NetworkMatchesProps = {
  items: NetworkMatchItem[];
  isPending: boolean;
  onConnect: (userId: string) => void;
  onRemove: (userId: string) => void;
};

export function NetworkMatches({
  items,
  isPending,
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
        {items.map(({ user, state }) => (
          <NetworkUserCard
            key={user.id}
            user={user}
            state={state}
            isPending={isPending}
            onConnect={onConnect}
            onRemove={onRemove}
          />
        ))}
      </div>
    </section>
  );
}
