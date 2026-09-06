import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { profileApi } from "./api";
import { getSessionToken } from "@/utils/session";

export function isAuthenticated(): boolean {
  return Boolean(getSessionToken());
}

export function useAuth() {
  const navigate = useNavigate();
  const sessionToken = getSessionToken();

  const currentUserQuery = useQuery({
    queryKey: ["me"],
    queryFn: () => profileApi.getCurrent(),
    enabled: Boolean(sessionToken),
    retry: 1,
    staleTime: 60_000,
  });

  return {
    user: currentUserQuery.data ?? null,
    isLoading: currentUserQuery.isLoading,
    isAuthenticated: Boolean(sessionToken),
    requireAuth: () => {
      if (sessionToken) return true;
      navigate({ to: "/entrar", search: { tab: "login" } });
      return false;
    },
  };
}
