import type { TalentBankRecruiter } from "./talent-bank-recruiter";

/** A banca aberta: finalidade, condições de tratamento e quem publica. */
export type TalentBankDetail = {
  id: string;
  title: string;
  purpose: string;
  description: string | null;
  handlingConditions: string;
  focusArea: string | null;
  desiredSkills: string[];
  requestedFields: string[];
  consentVersion: string;
  createdAt: string;
  recruiter: TalentBankRecruiter;
  /** O estado da inscrição de quem está olhando, quando existe. */
  myState: string | null;
};
