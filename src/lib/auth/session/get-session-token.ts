import { getAuthStorage } from "./get-auth-storage";

export function getSessionToken(): string | null {
  return getAuthStorage()?.getItem("session_token") ?? null;
}
