import { useAppShellStore } from "@/stores/app-shell.store";

export function useMobileNavigationButtonController() {
  const openMobileNavigation = useAppShellStore((state) => state.openMobileNavigation);

  return { openMobileNavigation };
}
