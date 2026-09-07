import { useAppShellStore } from "@/stores/app-shell.store";

import { getCurrentUser } from "@/lib/get-current-user";

export function useAuthenticatedAppHeaderController() {
  const openMobileNavigation = useAppShellStore((state) => state.openMobileNavigation);
  const profile = getCurrentUser();

  return {
    openMobileNavigation,
    profile,
    showProfile: Boolean(profile),
  };
}
