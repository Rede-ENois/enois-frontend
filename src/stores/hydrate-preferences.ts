import { usePreferencesStore } from "@/stores/preferences.store";

let hydrationStarted = false;

export function hydratePreferences() {
  if (hydrationStarted) return;
  hydrationStarted = true;
  void usePreferencesStore.persist.rehydrate();
}
