/** Uma formação, quando a pessoa autorizou. */
export type TalentBankEducation = {
  id: string;
  school: string;
  degree: string | null;
  field: string | null;
  description: string | null;
  currentlyHere: boolean;
  startDate: string | null;
  endDate: string | null;
};
