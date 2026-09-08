import { useIsAuthenticated } from "@/lib/auth/use-is-authenticated";

export function useAppContainerController() {
  return {
    authenticated: useIsAuthenticated(),
  };
}
