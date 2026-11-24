/** Os estados de uma inscrição; só `ACTIVE` libera a leitura dos dados autorizados. */
export type TalentBankEnrollmentState =
  "PENDING" | "ACTIVE" | "REVOKED_BY_CANDIDATE" | "CLOSED_BY_RECRUITER";
