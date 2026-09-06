export type AuthUser = {
  id: string;
  username: string;
  name: string;
  headline: string;
  email: string;
};

export type AuthResponse = {
  token: string;
  refreshToken: string;
  expiresAt: string;
  refreshExpiresAt: string;
  user: AuthUser;
};
