export type CertificationInput = {
  name: string;
  issuer: string;
  description?: string | null;
  issueDate?: string | null;
  expirationDate?: string | null;
  credentialUrl?: string | null;
};
