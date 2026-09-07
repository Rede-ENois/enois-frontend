import { AUTH_SESSION_KEYS } from "@/constants/auth-session-keys";

import { getAuthStorage } from "./get-auth-storage";
import { notifyAuthSessionChange } from "./notify-auth-session-change";

export function clearAuthSession() {
  const storage = getAuthStorage();
  if (!storage) return;

  for (const key of AUTH_SESSION_KEYS) storage.removeItem(key);
  notifyAuthSessionChange();
}
