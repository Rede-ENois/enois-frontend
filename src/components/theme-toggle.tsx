import { usePreferencesStore } from "@/stores/preferences.store";
import { ThemeToggle as ThemeToggleView } from "@rede-enois/design-system/patterns";

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
