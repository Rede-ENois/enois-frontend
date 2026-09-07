import { clearLegacyPreferencesStorage } from "@/lib/clear-legacy-preferences-storage";
import { getLegacyPreferencesStorageValue } from "@/lib/get-legacy-preferences-storage-value";
import { normalizePreferencesStorageValue } from "@/lib/normalize-preferences-storage-value";

export function createPreferencesStorage() {
  return {
    getItem: (name: string) => {
      const stored = localStorage.getItem(name);
      return stored === null
        ? getLegacyPreferencesStorageValue()
        : normalizePreferencesStorageValue(stored);
    },
    setItem: (name: string, value: string) => {
      localStorage.setItem(name, value);
      clearLegacyPreferencesStorage();
    },
    removeItem: (name: string) => {
      localStorage.removeItem(name);
    },
  };
}
