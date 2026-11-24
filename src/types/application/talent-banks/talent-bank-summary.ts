import type { TalentBankRecruiter } from "./talent-bank-recruiter";

/** Uma banca na vitrine pública: o que se procura e por quê, nunca quem se inscreveu. */
export type TalentBankSummary = {
  id: string;
  title: string;
  purpose: string;
  focusArea: string | null;
  desiredSkills: string[];
  /** As chaves das informações que a banca pede (`PROFILE`, `SKILLS`, ...). */
  requestedFields: string[];
  createdAt: string;
  recruiter: TalentBankRecruiter;
};
