/** Rolagem sorteada no servidor: o cliente nunca decide resultado. */
export type Roll = {
  id: string;
  campaignId: string;
  rollerId: string;
  expression: string;
  dice: number[];
  total: number;
  label: string | null;
  visibility: "PRIVATE" | "GAME_MASTER" | "CAMPAIGN";
  requestId: string | null;
  createdAt: string;
};
