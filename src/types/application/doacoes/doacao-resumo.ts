import type { DoacaoStatus } from "./doacao-status";

export type DoacaoResumo = {
  id: string;
  txid: string;
  amountCents: number;
  status: DoacaoStatus;
  createdAt: string;
  confirmedAt: string;
};
