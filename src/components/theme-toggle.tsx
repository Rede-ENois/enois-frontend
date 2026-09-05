import { useEffect, useState } from "react";

import { Monitor, Moon, Sun } from "lucide-react";

import { texts } from "@/texts";
import {
  applyTheme,
  getStoredTheme,
  nextTheme,
  saveTheme,
  type Theme,
} from "@/utils/theme";

const themeMeta: Record<Theme, { Icon: React.ElementType; label: string }> = {
  light: { Icon: Sun, label: texts.theme.light },
  dark: { Icon: Moon, label: texts.theme.dark },
  system: { Icon: Monitor, label: texts.theme.system },
};

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    const initial = getStoredTheme();
    setTheme(initial);
    applyTheme(initial);

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const syncSystem = () => {
      if (getStoredTheme() === "system") applyTheme("system");
    };

    media.addEventListener("change", syncSystem);
    return () => media.removeEventListener("change", syncSystem);
  }, []);

  const cycleTheme = () => {
    const next = nextTheme[theme];
    setTheme(next);
    saveTheme(next);
  };

  const { Icon, label } = themeMeta[theme];

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
