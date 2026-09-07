import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { createPreferencesStorage } from "@/lib/create-preferences-storage";
import type { Theme } from "@/types/preferences/theme";

const PREFERENCES_STORAGE_KEY = "connect-grow-preferences";

export const usePreferencesStore = create()(
  persist(
    (set) => ({
      theme: "light" as Theme,
      sidebarCollapsed: false,

      setTheme: (theme: Theme) => set({ theme }),
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
