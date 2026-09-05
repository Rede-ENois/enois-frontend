import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { profileApi } from "./api";
import { getSessionToken } from "@/utils/session";

export function isAuthenticated(): boolean {
  return Boolean(getSessionToken());
}

export function useAuth() {
  const navigate = useNavigate();
  const token = getSessionToken();

  const query = useQuery({
    queryKey: ["me"],
    queryFn: () => profileApi.me(),
    enabled: Boolean(token),
    retry: 1,
    staleTime: 60_000,
  });

  return {
    user: query.data ?? null,
    isLoading: query.isLoading,
    isAuthenticated: Boolean(token),
    requireAuth: () => {
      if (token) return true;
      navigate({ to: "/entrar", search: { tab: "login" } });
      return false;
    },
  };
}
