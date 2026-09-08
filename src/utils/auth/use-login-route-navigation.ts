import { useNavigate } from "@tanstack/react-router";

export function useLoginRouteNavigation() {
  const navigate = useNavigate();
  return () => navigate({ to: "/entrar", search: { tab: "login" } });
}
