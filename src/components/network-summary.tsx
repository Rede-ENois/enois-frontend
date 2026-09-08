import { texts } from "@/texts";
import { useNetworkSummaryController } from "@/utils/components/network/use-network-summary-controller";

import { Stat } from "@/components/network-stat";

export function NetworkSummary() {
  const { stats } = useNetworkSummaryController();

  return (
    <div className="surface-card p-4 sm:p-6">
      <h1 className="text-2xl font-semibold tracking-tight">{texts.network.title}</h1>

      <p className="mt-1 text-sm text-muted-foreground">{texts.network.description}</p>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map(({ key, ...stat }) => (
          <Stat key={key} {...stat} />
        ))}
      </div>
    </div>
  );
}
