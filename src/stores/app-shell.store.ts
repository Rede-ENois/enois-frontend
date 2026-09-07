import type { AppShellStore } from "@/types/stores/app-shell-store";
import { create } from "zustand";

export const useAppShellStore = create<AppShellStore>()((set) => ({
  mobileNavigationOpen: false,
  openMobileNavigation: () => set({ mobileNavigationOpen: true }),
  closeMobileNavigation: () => set({ mobileNavigationOpen: false }),
}));
