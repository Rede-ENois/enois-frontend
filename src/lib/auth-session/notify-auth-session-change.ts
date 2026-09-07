import { AUTH_SESSION_CHANGE_EVENT } from "@/constants/auth-session-change-event";

export function notifyAuthSessionChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_SESSION_CHANGE_EVENT));
}
