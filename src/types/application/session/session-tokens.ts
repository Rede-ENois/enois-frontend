export type SessionTokens = {
  token: string;
  refreshToken?: string | null;
  expiresAt?: string | null;
  refreshExpiresAt?: string | null;
};

export type AuthenticatedSession = SessionTokens & {
  user: unknown;
};
