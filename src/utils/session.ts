import type { AuthenticatedSession, SessionTokens } from "@/types/application/session/session-tokens";

export const sessionKeys = {
  token: "session_token",
  refreshToken: "refresh_token",
  expiresAt: "session_expires_at",
  refreshExpiresAt: "refresh_expires_at",
  currentUser: "current_user",
} as const;

export function getSessionToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(sessionKeys.token);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(sessionKeys.refreshToken);
}

export function storeSessionTokens({ token, refreshToken, expiresAt, refreshExpiresAt }: SessionTokens): void {
  window.localStorage.setItem(sessionKeys.token, token);

  const optionalValues: Partial<Record<keyof typeof sessionKeys, string | null | undefined>> = {
    refreshToken,
    expiresAt,
    refreshExpiresAt,
  };

  Object.entries(optionalValues).forEach(([key, value]) => {
    if (value) window.localStorage.setItem(sessionKeys[key as keyof typeof sessionKeys], value);
  });
}

export function storeCurrentUser(user: unknown): void {
  window.localStorage.setItem(sessionKeys.currentUser, JSON.stringify(user));
}

export function storeAuthenticatedSession(session: AuthenticatedSession): void {
  storeSessionTokens(session);
  storeCurrentUser(session.user);
}

export function clearSession(): void {
  Object.values(sessionKeys).forEach((key) => window.localStorage.removeItem(key));
}

export function consumeOAuthSession(search: string): boolean {
  if (typeof window === "undefined") return false;

  const params = new URLSearchParams(search);
  const token = params.get("token");
  if (!token) return false;

  storeSessionTokens({
    token,
    refreshToken: params.get("refreshToken"),
    expiresAt: params.get("expiresAt"),
    refreshExpiresAt: params.get("refreshExpiresAt"),
  });

  return true;
}
