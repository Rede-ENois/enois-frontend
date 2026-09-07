import type { Theme } from "@/types/preferences/theme";

export type PreferencesStore = {
  theme: Theme;
  sidebarCollapsed: boolean;
  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
};
