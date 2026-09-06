import type { ResolvedTheme } from "@/types/application/theme/resolved-theme";
import type { Theme } from "@/types/application/theme/theme";

export const THEME_STORAGE_KEY = "connect-grow-theme";

const storedThemes: Record<string, Theme> = {
  light: "light",
  dark: "dark",
  system: "system",
};

export const nextTheme: Record<Theme, Theme> = {
  light: "dark",
  dark: "system",
  system: "light",
};

export function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function resolveTheme(theme: Theme): ResolvedTheme {
  return theme === "system" ? getSystemTheme() : theme;
}

export function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle("dark", resolveTheme(theme) === "dark");
}

export function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return stored ? storedThemes[stored] ?? "system" : "system";
}

export function saveTheme(theme: Theme): void {
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  applyTheme(theme);
}
