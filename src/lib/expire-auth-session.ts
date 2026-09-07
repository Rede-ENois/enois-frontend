import { clearAuthSession } from "@/lib/auth-session/clear-auth-session";

export function expireAuthSession() {
  clearAuthSession();
  if (typeof window !== "undefined") window.location.href = "/entrar?tab=login";
}
