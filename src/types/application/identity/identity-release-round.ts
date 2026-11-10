/** Uma rodada de liberação já executada, com o que liberou e por que parou. */
export type IdentityReleaseRound = {
  id: string;
  executedAt: string;
  eligibleCount: number;
  releasedCount: number;
  minReputation: number;
  rankStart: number;
  rankEnd: number;
  state: "PENDING" | "RUNNING" | "COMPLETED" | "PAUSED" | "CANCELLED";
  reservedCapacityUsed: number;
  note: string | null;
};
