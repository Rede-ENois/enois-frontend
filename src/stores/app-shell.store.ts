import type { AppShellState } from "@/types/stores/app-shell-state";
import { create } from "zustand";

export const useAppShellStore = create<AppShellState>()((set) => ({
  mobileNavigationOpen: false,
  openMobileNavigation: () => set({ mobileNavigationOpen: true }),
  closeMobileNavigation: () => set({ mobileNavigationOpen: false }),
}));
