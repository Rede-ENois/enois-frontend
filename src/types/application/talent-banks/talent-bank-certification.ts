/** Uma certificação, quando a pessoa autorizou. */
export type TalentBankCertification = {
  id: string;
  name: string;
  issuer: string | null;
  description: string | null;
  issueDate: string | null;
  expirationDate: string | null;
  credentialUrl: string | null;
};
