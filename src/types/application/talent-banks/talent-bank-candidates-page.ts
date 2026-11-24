import type { TalentBankCandidateRow } from "./talent-bank-candidate-row";

/** A página de inscritos do recrutador, com os totais do banco inteiro. */
export type TalentBankCandidatesPage = {
  items: TalentBankCandidateRow[];
  nextCursor: string | null;
  activeTotal: number;
  pendingTotal: number;
};
