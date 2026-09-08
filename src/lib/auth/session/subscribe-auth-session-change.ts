import { AUTH_SESSION_CHANGE_EVENT } from "@/constants/auth/auth-session-change-event";
import { AUTH_SESSION_KEYS } from "@/constants/auth/auth-session-keys";

export function subscribeAuthSessionChange(callback: () => void) {
  if (typeof window === "undefined") return () => {};

  const handleStorage = (event: StorageEvent) => {
    if (event.key === null || AUTH_SESSION_KEYS.some((key) => key === event.key)) callback();
  };

  window.addEventListener(AUTH_SESSION_CHANGE_EVENT, callback);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(AUTH_SESSION_CHANGE_EVENT, callback);
    window.removeEventListener("storage", handleStorage);
  };
}
