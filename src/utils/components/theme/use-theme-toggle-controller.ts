import { useEffect } from "react";

import { hydratePreferences } from "@/stores/hydrate-preferences";
import { usePreferencesStore } from "@/stores/preferences.store";
import { texts } from "@/texts";
import type { Theme } from "@/types/preferences/theme";
import { Moon, Sun } from "lucide-react";

export function useThemeToggleController() {
  const theme = usePreferencesStore((state) => state.theme);
  const setTheme = usePreferencesStore((state) => state.setTheme);

  useEffect(() => {
    hydratePreferences();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const toggleTheme = () => {
    const next: Theme = theme === "light" ? "dark" : "light";
    setTheme(next);
  };

  return {
    Icon: theme === "light" ? Sun : Moon,
    label: theme === "light" ? texts.theme.light : texts.theme.dark,
    toggleTheme,
  };
}
