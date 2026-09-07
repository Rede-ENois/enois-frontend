import { useIsAuthenticated } from "@/lib/use-is-authenticated";

export function useAppContainerController() {
  return {
    authenticated: useIsAuthenticated(),
  };
}
