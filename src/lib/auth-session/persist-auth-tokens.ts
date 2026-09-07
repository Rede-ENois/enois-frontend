import type { AuthTokenSession } from "@/types/application/auth/auth-token-session";

import { getAuthStorage } from "./get-auth-storage";
import { notifyAuthSessionChange } from "./notify-auth-session-change";

export function persistAuthTokens(session: AuthTokenSession) {
  const storage = getAuthStorage();
  if (!storage) return;

  storage.setItem("session_token", session.token);
  if (session.refreshToken) storage.setItem("refresh_token", session.refreshToken);
  if (session.expiresAt) storage.setItem("session_expires_at", session.expiresAt);
  if (session.refreshExpiresAt) storage.setItem("refresh_expires_at", session.refreshExpiresAt);

  notifyAuthSessionChange();
}
