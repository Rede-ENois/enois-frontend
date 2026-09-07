import type { PreferencesStore } from "@/types/stores/preferences-store";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { createPreferencesStorage } from "@/lib/create-preferences-storage";

const PREFERENCES_STORAGE_KEY = "connect-grow-preferences";

export const usePreferencesStore = create<PreferencesStore>()(
  persist(
    (set) => ({
      theme: "light",
      sidebarCollapsed: false,

      setTheme: (theme) => set({ theme }),
      toggleSidebar: () =>
        set((state) => ({
          sidebarCollapsed: !state.sidebarCollapsed,
        })),
    }),
    {
      name: PREFERENCES_STORAGE_KEY,
      storage: createJSONStorage(createPreferencesStorage),
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
      skipHydration: true,
    },
  ),
);
