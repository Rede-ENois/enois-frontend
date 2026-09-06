import type { NetworkSummary } from "@/lib/api";

export type NetworkOverviewProps = {
  summary: NetworkSummary | undefined;
  suggestionCount: number;
};
