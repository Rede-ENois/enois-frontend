import { useNavigate } from "@tanstack/react-router";

import { getSessionToken } from "./auth-session";
import { useCurrentUser } from "./current-user";

export function isAuthenticated(): boolean {
  return !!getSessionToken();
}

export function useAuth() {
  const navigate = useNavigate();
  const token = getSessionToken();
  const query = useCurrentUser();

  return {
    user: query.data ?? null,
    isLoading: query.isLoading,
    isAuthenticated: !!token,
    requireAuth: () => {
      if (!token) {
        navigate({ to: "/entrar", search: { tab: "login" } });
        return false;
      }
      return true;
    },
  };
}
