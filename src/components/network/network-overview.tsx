import type { NetworkSummary } from "@/lib/api";
import { texts } from "@/texts";

import { NetworkStat } from "./network-stat";

export function NetworkOverview({
  summary,
  suggestionsCount,
}: {
  summary: NetworkSummary | undefined;
  suggestionsCount: number;
}) {
  const stats = [
    { label: texts.network.stats.connections, value: summary?.connections ?? 0 },
    { label: texts.network.stats.following, value: summary?.followers ?? 0 },
    { label: texts.network.stats.requests, value: summary?.pendingRequests ?? 0, highlight: true },
    { label: texts.network.stats.suggestions, value: suggestionsCount },
  ];

  return (
    <div className="surface-card p-4 sm:p-6">
      <h1 className="text-2xl font-semibold tracking-tight">{texts.network.title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{texts.network.description}</p>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => (
          <NetworkStat
            key={stat.label}
            label={stat.label}
            value={String(stat.value)}
            highlight={stat.highlight}
          />
        ))}
      </div>
    </div>
  );
}
