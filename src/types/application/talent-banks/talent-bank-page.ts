import type { TalentBankSummary } from "./talent-bank-summary";

/** Uma página da vitrine de bancos. */
export type TalentBankPage = {
  items: TalentBankSummary[];
  nextCursor: string | null;
};
