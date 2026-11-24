import type { TalentBankEnrollmentState } from "./talent-bank-enrollment-state";

/** Uma inscrição da própria pessoa: onde se inscreveu e como está. */
export type TalentBankMyEnrollment = {
  enrollmentId: string;
  bankId: string;
  bankTitle: string;
  bankPurpose: string;
  recruiterName: string | null;
  recruiterUsername: string | null;
  state: TalentBankEnrollmentState;
  sharedFields: string[];
  consentVersion: string;
  requestedAt: string;
  consentedAt: string | null;
  revokedAt: string | null;
  closedAt: string | null;
  updatedAt: string;
};
