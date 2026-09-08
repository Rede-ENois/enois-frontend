import { getSessionToken } from "./session/get-session-token";

export function isAuthenticated(): boolean {
  return !!getSessionToken();
}
