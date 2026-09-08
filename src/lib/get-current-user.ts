import { CURRENT_USER_QUERY_KEY } from "@/constants/auth/current-user-query-key";
import type { Profile } from "@/types/application/profile/profile";

import { getSessionToken } from "./auth/session/get-session-token";
import { browserQueryClient } from "./query-client";

export function getCurrentUser(): Profile | null {
  if (!getSessionToken()) return null;

  return browserQueryClient.current?.getQueryData<Profile>(CURRENT_USER_QUERY_KEY) ?? null;
}
