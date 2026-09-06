import type { AuthUser } from "./auth-user";

export type AuthResponse = {
  token: string;
  refreshToken: string;
  expiresAt: string;
  refreshExpiresAt: string;
  user: AuthUser;
};
