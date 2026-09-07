import type { PreferencesStorageValue } from "@/types/stores/preferences-storage-value";

export function normalizePreferencesStorageValue(stored: string) {
  try {
    const parsed = JSON.parse(stored) as PreferencesStorageValue;

    if (parsed.state) {
      parsed.state.theme = parsed.state.theme === "dark" ? "dark" : "light";
    }

    return JSON.stringify(parsed);
  } catch {
    return stored;
  }
}
