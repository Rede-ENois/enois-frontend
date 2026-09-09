import { useAppShellStore } from "@/stores/app-shell.store";

export function useNavigationDrawerController() {
  const open = useAppShellStore((state) => state.mobileNavigationOpen);
  const close = useAppShellStore((state) => state.closeMobileNavigation);

  return {
    open,
    handleOpenChange: (nextOpen: boolean) => {
      if (!nextOpen) close();
    },
  };
}
