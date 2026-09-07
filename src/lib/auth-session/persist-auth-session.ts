import type { AuthResponse } from "@/types/application/auth/auth-response";

import { getAuthStorage } from "./get-auth-storage";
import { persistAuthTokens } from "./persist-auth-tokens";

export function persistAuthSession(session: AuthResponse) {
  const storage = getAuthStorage();
  if (!storage) return;

  persistAuthTokens(session);
  storage.setItem("current_user", JSON.stringify(session.user));
}
