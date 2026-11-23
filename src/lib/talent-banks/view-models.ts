import type { TalentBankCandidateDetail } from "@/types/application/talent-banks/talent-bank-candidate-detail";
import type { TalentBankCandidateRow } from "@/types/application/talent-banks/talent-bank-candidate-row";
import type { TalentBankDetail } from "@/types/application/talent-banks/talent-bank-detail";
import type { TalentBankEnrollment } from "@/types/application/talent-banks/talent-bank-enrollment";
import type { TalentBankMyEnrollment } from "@/types/application/talent-banks/talent-bank-my-enrollment";
import type { TalentBankRecruiter } from "@/types/application/talent-banks/talent-bank-recruiter";
import type { TalentBankSummary } from "@/types/application/talent-banks/talent-bank-summary";
import type {
  TalentBankCandidateDetailData as TalentBankCandidateDetailView,
  TalentBankCandidateRow as TalentBankCandidateRowView,
  TalentBankDetail as TalentBankDetailView,
  TalentBankEnrollment as TalentBankEnrollmentView,
  TalentBankMyEnrollment as TalentBankMyEnrollmentView,
  TalentBankRecruiter as TalentBankRecruiterView,
  TalentBankSharedFieldOption,
  TalentBankSummary as TalentBankSummaryView,
} from "@rede-enois/design-system/domain";

/**
 * Tradução das respostas do backend para os modelos do design system.
 *
 * O desenho das telas vive no DS; aqui só muda o nome dos campos e se resolve o que o DS
 * precisa em texto pronto (os rótulos dos campos autorizados e o caminho da banca).
 */

/** Os campos que a banca pede, com o rótulo que a pessoa lê antes de autorizar. */
export function camposDaBanca(
  options: TalentBankSharedFieldOption[],
  keys: string[],
): TalentBankSharedFieldOption[] {
  const queridas = new Set(keys);

  return options.filter((option) => queridas.has(option.key));
}

export function paraRecruiter(recruiter: TalentBankRecruiter): TalentBankRecruiterView {
  return {
    userId: recruiter.userId,
    name: recruiter.name,
    username: recruiter.username,
    avatar: recruiter.avatar,
    headline: recruiter.headline,
    location: recruiter.location,
  };
}

export function paraResumo(
  bank: TalentBankSummary,
  options: TalentBankSharedFieldOption[],
  href: string,
): TalentBankSummaryView {
  return {
    id: bank.id,
    href,
    title: bank.title,
    purpose: bank.purpose,
    focusArea: bank.focusArea,
    desiredSkills: bank.desiredSkills,
    requestedFields: camposDaBanca(options, bank.requestedFields),
    createdAt: bank.createdAt,
    recruiter: paraRecruiter(bank.recruiter),
  };
}

export function paraDetalhe(
  bank: TalentBankDetail,
  options: TalentBankSharedFieldOption[],
): TalentBankDetailView {
  return {
    id: bank.id,
    title: bank.title,
    purpose: bank.purpose,
    description: bank.description,
    handlingConditions: bank.handlingConditions,
    focusArea: bank.focusArea,
    desiredSkills: bank.desiredSkills,
    requestedFields: camposDaBanca(options, bank.requestedFields),
    consentVersion: bank.consentVersion,
    createdAt: bank.createdAt,
    recruiter: paraRecruiter(bank.recruiter),
    myState: bank.myState as TalentBankDetailView["myState"],
  };
}

export function paraInscricao(enrollment: TalentBankEnrollment): TalentBankEnrollmentView {
  return {
    id: enrollment.id,
    state: enrollment.state,
    sharedFields: enrollment.sharedFields,
    requestedAt: enrollment.requestedAt,
    consentedAt: enrollment.consentedAt,
    revokedAt: enrollment.revokedAt,
    closedAt: enrollment.closedAt,
  };
}

export function paraMinhaInscricao(enrollment: TalentBankMyEnrollment): TalentBankMyEnrollmentView {
  return {
    enrollmentId: enrollment.enrollmentId,
    bankId: enrollment.bankId,
    bankTitle: enrollment.bankTitle,
    bankPurpose: enrollment.bankPurpose,
    recruiterName: enrollment.recruiterName,
    recruiterUsername: enrollment.recruiterUsername,
    state: enrollment.state,
    sharedFields: enrollment.sharedFields,
    requestedAt: enrollment.requestedAt,
    consentedAt: enrollment.consentedAt,
  };
}

/** A inscrição da própria pessoa, no formato que a tela de consentimento entende. */
export function paraInscricaoDaPessoa(
  enrollment: TalentBankMyEnrollment,
): TalentBankEnrollmentView {
  return {
    id: enrollment.enrollmentId,
    state: enrollment.state,
    sharedFields: enrollment.sharedFields,
    requestedAt: enrollment.requestedAt,
    consentedAt: enrollment.consentedAt,
    revokedAt: enrollment.revokedAt,
    closedAt: enrollment.closedAt,
  };
}

export function paraCandidato(candidate: TalentBankCandidateRow): TalentBankCandidateRowView {
  return {
    enrollmentId: candidate.enrollmentId,
    state: candidate.state,
    userId: candidate.userId,
    name: candidate.name,
    username: candidate.username,
    headline: candidate.headline,
    avatar: candidate.avatar,
    location: candidate.location,
    experienceCount: candidate.experienceCount,
    sharedFields: candidate.sharedFields,
    note: candidate.note,
    consentedAt: candidate.consentedAt,
    resumeAvailable: candidate.resumeAvailable,
    resumeName: candidate.resumeName,
  };
}

export function paraFicha(candidate: TalentBankCandidateDetail): TalentBankCandidateDetailView {
  return {
    enrollmentId: candidate.enrollmentId,
    state: candidate.state,
    sharedFields: candidate.sharedFields,
    consentVersion: candidate.consentVersion,
    purposeSnapshot: candidate.purposeSnapshot,
    note: candidate.note,
    consentedAt: candidate.consentedAt,
    identity: candidate.identity
      ? {
          name: candidate.identity.name,
          username: candidate.identity.username,
          headline: candidate.identity.headline,
          avatar: candidate.identity.avatar,
          location: candidate.identity.location,
        }
      : null,
    skills: candidate.skills,
    experiences: candidate.experiences.map((experience) => ({
      id: experience.id,
      title: experience.title,
      company: experience.company,
      location: experience.location,
      description: experience.description,
      startDate: experience.startDate,
      endDate: experience.endDate,
    })),
    educations: candidate.educations.map((education) => ({
      id: education.id,
      school: education.school,
      degree: education.degree,
      field: education.field,
      startDate: education.startDate,
      endDate: education.endDate,
    })),
    certifications: candidate.certifications.map((certification) => ({
      id: certification.id,
      name: certification.name,
      issuer: certification.issuer,
      issuedAt: certification.issueDate,
    })),
    resumeAuthorized: candidate.resumeAuthorized,
    resumeAvailable: candidate.resumeAvailable,
    resumeName: candidate.resumeName,
  };
}
