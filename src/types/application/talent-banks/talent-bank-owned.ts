/** O banco como o próprio recrutador o administra. */
export type TalentBankOwned = {
  id: string;
  title: string;
  purpose: string;
  description: string | null;
  handlingConditions: string;
  focusArea: string | null;
  desiredSkills: string[];
  requestedFields: string[];
  consentVersion: string;
  discoverable: boolean;
  activeEnrollments: number;
  createdAt: string;
  updatedAt: string;
};
