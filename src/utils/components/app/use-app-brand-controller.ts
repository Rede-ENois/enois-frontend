import { useAppShellStore } from "@/stores/app-shell.store";

export function useAppBrandController() {
  const closeMobileNavigation = useAppShellStore((state) => state.closeMobileNavigation);

  return { closeMobileNavigation };
}
