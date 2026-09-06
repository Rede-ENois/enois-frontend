export type Certification = {
  id: string;
  name: string;
  issuer: string;
  description: string | null;
  issueDate: string | null;
  expirationDate: string | null;
  credentialUrl: string | null;
};

export type CertificationInput = Pick<Certification, "name" | "issuer"> &
  Partial<Pick<Certification, "description" | "issueDate" | "expirationDate" | "credentialUrl">>;
