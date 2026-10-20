export type CoinDisputeView = {
  id: string;
  entryRef: string;
  amount: number;
  reason: string;
  state: "OPEN" | "UPHELD" | "REJECTED";
  createdAt: string;
  reviewNote?: string;
};
