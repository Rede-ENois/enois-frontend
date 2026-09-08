import { texts } from "@/texts";
import { useNetworkMatchesController } from "@/utils/components/network/use-network-matches-controller";

import { NetworkMatchCard } from "@/components/network-match-card";

export function NetworkMatches() {
  const { users } = useNetworkMatchesController();

  return (
    <section>
      <header className="mb-3">
        <h2 className="text-lg font-semibold">{texts.network.matchesTitle}</h2>

        <p className="text-sm text-muted-foreground">{texts.network.matchesDescription}</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {users.map((user) => (
          <NetworkMatchCard key={user.id} user={user} />
        ))}
      </div>
    </section>
  );
}
