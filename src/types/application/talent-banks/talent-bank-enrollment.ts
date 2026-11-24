import type { TalentBankEnrollmentState } from "./talent-bank-enrollment-state";

/** A inscrição como as duas partes a veem: estado, campos autorizados e datas. */
export type TalentBankEnrollment = {
  id: string;
  bankId: string;
  state: TalentBankEnrollmentState;
  sharedFields: string[];
  consentVersion: string;
  purposeSnapshot: string;
  note: string | null;
  requestedAt: string;
  consentedAt: string | null;
  activatedAt: string | null;
  revokedAt: string | null;
  closedAt: string | null;
  erasedAt: string | null;
  updatedAt: string;
};
