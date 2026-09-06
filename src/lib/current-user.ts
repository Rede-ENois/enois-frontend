import { queryOptions, useQuery } from "@tanstack/react-query";

import type { Profile } from "@/types/application/profile/profile";

import { profileApi } from "./api/profile";
import { getSessionToken } from "./auth-session";
import { getBrowserQueryClient } from "./query-client";

const CURRENT_USER_QUERY_KEY = ["me"] as const;

export function currentUserQueryOptions() {
  return queryOptions({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: () => profileApi.me(),
    staleTime: 60_000,
    retry: 1,
  });
}

export function useCurrentUser() {
  const token = getSessionToken();

  return useQuery({
    ...currentUserQueryOptions(),
    enabled: !!token,
  });
}

export function getCurrentUser(): Profile | null {
  if (!getSessionToken()) return null;

  return getBrowserQueryClient()?.getQueryData<Profile>(CURRENT_USER_QUERY_KEY) ?? null;
}

export function getCurrentUserId() {
  return getCurrentUser()?.id ?? null;
}
