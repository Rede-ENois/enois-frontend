import type { AuthUser } from "./auth-user";

export type SessionPayload = {
  token: string;
  refreshToken?: string | null;
  expiresAt?: string | null;
  refreshExpiresAt?: string | null;
  user?: AuthUser;
};
