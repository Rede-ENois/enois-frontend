import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { Theme } from "@/types/preferences/theme";
import type { PreferencesStorageValue } from "@/types/stores/preferences-storage-value";

const PREFERENCES_STORAGE_KEY = "connect-grow-preferences";
const LEGACY_THEME_STORAGE_KEY = "connect-grow-theme";
const LEGACY_SIDEBAR_STORAGE_KEY = "sidebar-collapsed";

const preferencesStorage = {
  getItem: (name: string) => {
    const stored = localStorage.getItem(name);
    if (stored !== null) {
      try {
        const parsed = JSON.parse(stored) as PreferencesStorageValue;

        if (parsed.state) {
          parsed.state.theme = parsed.state.theme === "dark" ? "dark" : "light";
        }

        return JSON.stringify(parsed);
      } catch {
        return stored;
      }
    }

    const legacyTheme = localStorage.getItem(LEGACY_THEME_STORAGE_KEY);
    const legacySidebarCollapsed = localStorage.getItem(LEGACY_SIDEBAR_STORAGE_KEY);

    if (legacyTheme === null && legacySidebarCollapsed === null) return null;

    return JSON.stringify({
      state: {
        theme: legacyTheme === "dark" ? "dark" : "light",
        sidebarCollapsed: legacySidebarCollapsed === "true",
      },
      version: 0,
    });
  },
  setItem: (name: string, value: string) => {
    localStorage.setItem(name, value);
    localStorage.removeItem(LEGACY_THEME_STORAGE_KEY);
    localStorage.removeItem(LEGACY_SIDEBAR_STORAGE_KEY);
  },
  removeItem: (name: string) => {
    localStorage.removeItem(name);
  },
};

let hydrationStarted = false;

export const usePreferencesStore = Object.assign(
  create()(
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
        storage: createJSONStorage(() => preferencesStorage),
        partialize: (state) => ({
          theme: state.theme,
          sidebarCollapsed: state.sidebarCollapsed,
        }),
        skipHydration: true,
      },
    ),
  ),
  {
    hydrate: () => {
      if (hydrationStarted) return;
      hydrationStarted = true;
      void usePreferencesStore.persist.rehydrate();
    },
  },
);
