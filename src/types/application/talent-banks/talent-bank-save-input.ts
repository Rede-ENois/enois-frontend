/** O que o recrutador escreve no banco dele. */
export type TalentBankSaveInput = {
  title: string;
  purpose: string;
  description: string;
  handlingConditions: string;
  focusArea: string;
  desiredSkills: string[];
  requestedFields: string[];
};
