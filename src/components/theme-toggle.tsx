import { useEffect } from "react";

import { hydratePreferences } from "@/stores/hydrate-preferences";
import { usePreferencesStore } from "@/stores/preferences.store";
import { texts } from "@/texts";
import type { Theme } from "@/types/preferences/theme";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const theme = usePreferencesStore((state) => state.theme);
  const setTheme = usePreferencesStore((state) => state.setTheme);

  useEffect(() => {
    hydratePreferences();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const cycleTheme = () => {
    const next: Theme = theme === "light" ? "dark" : "light";
    setTheme(next);
  };

  const Icon = theme === "light" ? Sun : Moon;
  const label = theme === "light" ? texts.theme.light : texts.theme.dark;

  return (
    <button
      type="button"
      onClick={cycleTheme}
      className="grid h-10 w-10 place-items-center rounded-full text-text-subtle transition hover:bg-surface-2 hover:text-primary"
      aria-label={label}
      title={label}
    >
      <Icon className="h-5 w-5 transition-transform duration-300 ease-out" />
    </button>
  );
}
