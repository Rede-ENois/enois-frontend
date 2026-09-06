import { useQuery } from "@tanstack/react-query";

import { networkApi } from "@/lib/api/network";
import { texts } from "@/texts";
import type { StatProps } from "@/types/components/network/stat-props";

export function NetworkSummary() {
  const { data: summary } = useQuery({
    queryKey: ["network", "summary"],
    queryFn: () => networkApi.summary(),
  });

  const { data: usersData } = useQuery({
    queryKey: ["network", "users"],
    queryFn: () => networkApi.list(),
  });

  const suggestionCount = usersData?.items.length ?? 0;

  return (
    <div className="surface-card p-4 sm:p-6">
      <h1 className="text-2xl font-semibold tracking-tight">{texts.network.title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{texts.network.description}</p>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label={texts.network.stats.connections} value={String(summary?.connections ?? 0)} />
        <Stat label={texts.network.stats.following} value={String(summary?.followers ?? 0)} />
        <Stat
          label={texts.network.stats.requests}
          value={String(summary?.pendingRequests ?? 0)}
          highlight
        />
        <Stat label={texts.network.stats.suggestions} value={String(suggestionCount)} />
      </div>
    </div>
  );
}

function Stat({ label, value, highlight }: StatProps) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        highlight ? "border-primary/30 bg-primary-soft" : "border-border bg-muted/40"
      }`}
    >
      <p className={`text-2xl font-semibold ${highlight ? "text-primary" : ""}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
