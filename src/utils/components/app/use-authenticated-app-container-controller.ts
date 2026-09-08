import { useCurrentUser } from "@/lib/auth/current-user";

export function useAuthenticatedAppContainerController() {
  useCurrentUser();
}
