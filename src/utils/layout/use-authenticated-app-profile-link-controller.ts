import { getCurrentUser } from "@/lib/get-current-user";

export function useAuthenticatedAppProfileLinkController() {
  return {
    profile: getCurrentUser(),
  };
}
