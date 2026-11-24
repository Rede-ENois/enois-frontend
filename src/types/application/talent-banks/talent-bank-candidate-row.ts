import type { TalentBankEnrollmentState } from "./talent-bank-enrollment-state";

/** Uma pessoa inscrita, como o recrutador a vê na lista do seu banco. */
export type TalentBankCandidateRow = {
  enrollmentId: string;
  state: TalentBankEnrollmentState;
  userId: string;
  name: string | null;
  username: string | null;
  headline: string | null;
  avatar: string | null;
  location: string | null;
  experienceCount: number;
  sharedFields: string[];
  note: string | null;
  consentedAt: string | null;
  resumeAvailable: boolean;
  resumeName: string | null;
};
