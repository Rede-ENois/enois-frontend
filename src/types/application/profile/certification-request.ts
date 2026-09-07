import type { Certification } from "./certification";

export type CertificationRequest = Pick<Certification, "name" | "issuer"> &
  Partial<Pick<Certification, "description" | "issueDate" | "expirationDate" | "credentialUrl">>;
