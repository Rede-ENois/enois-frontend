export type SessionTokens = {
  token: string;
  refreshToken?: string | null;
  expiresAt?: string | null;
  refreshExpiresAt?: string | null;
};
