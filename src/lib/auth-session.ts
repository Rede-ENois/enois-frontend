import type { AuthResponse } from "@/types/application/auth/auth-response";

const SESSION_KEYS = [
  "session_token",
  "refresh_token",
  "session_expires_at",
  "refresh_expires_at",
  "current_user",
] as const;

function getStorage() {
  return typeof window === "undefined" ? null : localStorage;
}

export function getSessionToken(): string | null {
  return getStorage()?.getItem("session_token") ?? null;
}

export function getRefreshToken(): string | null {
  return getStorage()?.getItem("refresh_token") ?? null;
}

export function clearAuthSession() {
  const storage = getStorage();
  if (!storage) return;

  for (const key of SESSION_KEYS) storage.removeItem(key);
}

export function persistAuthTokens(
  session: Pick<AuthResponse, "token" | "refreshToken" | "expiresAt" | "refreshExpiresAt">,
) {
  const storage = getStorage();
  if (!storage) return;

  storage.setItem("session_token", session.token);
  storage.setItem("refresh_token", session.refreshToken);
  storage.setItem("session_expires_at", session.expiresAt);
  storage.setItem("refresh_expires_at", session.refreshExpiresAt);
}

export function persistAuthSession(session: AuthResponse) {
  const storage = getStorage();
  if (!storage) return;

  persistAuthTokens(session);
  storage.setItem("current_user", JSON.stringify(session.user));
}
