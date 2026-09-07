import { getSessionToken } from "./auth-session/get-session-token";

export function isAuthenticated(): boolean {
  return !!getSessionToken();
}
