import { usePreferencesStore } from "@/stores/preferences.store";
import {
  ThemeSwitch as ThemeSwitchView,
  ThemeToggle as ThemeToggleView,
} from "@rede-enois/design-system/patterns";

/** Alterna claro/escuro. A aplicação no DOM fica em `useThemeSync`, no root. */
export function ThemeToggle() {
  const theme = usePreferencesStore((state) => state.theme);
  const setTheme = usePreferencesStore((state) => state.setTheme);

  return (
    <ThemeToggleView
      theme={theme}
      onToggle={() => setTheme(theme === "light" ? "dark" : "light")}
    />
  );
}

/** Light / dark as a segmented control, for the account menu row. */
export function ThemeSwitch() {
  const theme = usePreferencesStore((state) => state.theme);
  const setTheme = usePreferencesStore((state) => state.setTheme);

  return <ThemeSwitchView theme={theme} onChange={setTheme} />;
}
