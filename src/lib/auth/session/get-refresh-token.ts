import { getAuthStorage } from "./get-auth-storage";

export function getRefreshToken(): string | null {
  return getAuthStorage()?.getItem("refresh_token") ?? null;
}
