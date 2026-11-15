export type RollRequest = {
  id: string;
  campaignId: string;
  masterId: string;
  playerId: string;
  expression: string;
  label: string | null;
  maxVisibility: string;
  reason: string | null;
  status: "PENDING" | "ANSWERED";
  answeredRollId: string | null;
  createdAt: string;
  answeredAt: string | null;
};
