import { useCurrentUser } from "@/lib/current-user";

export function useAuthenticatedAppContainerController() {
  useCurrentUser();
}
