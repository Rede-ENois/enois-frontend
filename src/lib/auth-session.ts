import type { AuthResponse } from "@/types/application/auth/auth-response";

const SESSION_KEYS = [
  "session_token",
  "refresh_token",
  "session_expires_at",
  "refresh_expires_at",
  "current_user",
] as const;

export function clearAuthSession() {
  for (const key of SESSION_KEYS) localStorage.removeItem(key);
}

export function persistAuthSession(session: AuthResponse) {
  localStorage.setItem("session_token", session.token);
  localStorage.setItem("refresh_token", session.refreshToken);
  localStorage.setItem("session_expires_at", session.expiresAt);
  localStorage.setItem("refresh_expires_at", session.refreshExpiresAt);
  localStorage.setItem("current_user", JSON.stringify(session.user));
}
