import type { TalentBankCertification } from "./talent-bank-certification";
import type { TalentBankEducation } from "./talent-bank-education";
import type { TalentBankEnrollmentState } from "./talent-bank-enrollment-state";
import type { TalentBankExperience } from "./talent-bank-experience";
import type { TalentBankProfileIdentity } from "./talent-bank-profile-identity";

/** A ficha de uma pessoa inscrita: só os blocos que ela autorizou. */
export type TalentBankCandidateDetail = {
  enrollmentId: string;
  state: TalentBankEnrollmentState;
  sharedFields: string[];
  consentVersion: string;
  purposeSnapshot: string;
  note: string | null;
  consentedAt: string | null;
  identity: TalentBankProfileIdentity | null;
  skills: string[];
  experiences: TalentBankExperience[];
  educations: TalentBankEducation[];
  certifications: TalentBankCertification[];
  resumeAuthorized: boolean;
  resumeAvailable: boolean;
  resumeName: string | null;
};
