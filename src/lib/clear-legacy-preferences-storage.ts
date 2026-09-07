import { LEGACY_PREFERENCES_STORAGE_KEYS } from "@/constants/legacy-preferences-storage-keys";

export function clearLegacyPreferencesStorage() {
  localStorage.removeItem(LEGACY_PREFERENCES_STORAGE_KEYS.theme);
  localStorage.removeItem(LEGACY_PREFERENCES_STORAGE_KEYS.sidebarCollapsed);
}
