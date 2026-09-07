import { LEGACY_PREFERENCES_STORAGE_KEYS } from "@/constants/legacy-preferences-storage-keys";

export function getLegacyPreferencesStorageValue() {
  const legacyTheme = localStorage.getItem(LEGACY_PREFERENCES_STORAGE_KEYS.theme);
  const legacySidebarCollapsed = localStorage.getItem(
    LEGACY_PREFERENCES_STORAGE_KEYS.sidebarCollapsed,
  );

  if (legacyTheme === null && legacySidebarCollapsed === null) return null;

  return JSON.stringify({
    state: {
      theme: legacyTheme === "dark" ? "dark" : "light",
      sidebarCollapsed: legacySidebarCollapsed === "true",
    },
    version: 0,
  });
}
