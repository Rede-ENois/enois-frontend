import { AUTH_SESSION_KEYS } from "@/constants/auth-session-keys";

import { getAuthStorage } from "./get-auth-storage";

export function clearAuthSession() {
  const storage = getAuthStorage();
  if (!storage) return;

  for (const key of AUTH_SESSION_KEYS) storage.removeItem(key);
}
