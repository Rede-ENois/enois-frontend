import { useSyncExternalStore } from "react";

const KEY = "sanction_access";
const EVENT = "enois:sanction-access";
let sessionGeneration = 0;
const sessionListeners = new Set<() => void>();

/** Geração efêmera de apresentação; não representa identidade nem autorização do servidor. */
export function invalidateSanctionSession() {
  sessionGeneration++;
  for (const listener of sessionListeners) listener();
}
export function getSanctionSessionGeneration() {
  return sessionGeneration;
}
function subscribeSession(listener: () => void) {
  sessionListeners.add(listener);
  return () => sessionListeners.delete(listener);
}
export function useSanctionSessionGeneration() {
  return useSyncExternalStore(subscribeSession, getSanctionSessionGeneration, () => 0);
}

/** Indicador de navegação, nunca uma credencial ou prova de autorização. */
export function hasSanctionAccess(): boolean {
  return typeof localStorage !== "undefined" && localStorage.getItem(KEY) === "1";
}
function changed() {
  if (typeof window !== "undefined") window.dispatchEvent?.(new Event(EVENT));
}
export function markSanctionAccess() {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(KEY, "1");
  changed();
}
export function clearSanctionAccess() {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(KEY);
  changed();
}
export function isSanctionAccessEvent(event: StorageEvent): boolean {
  return event.key === KEY;
}
function subscribe(notify: () => void) {
  window.addEventListener(EVENT, notify);
  window.addEventListener("storage", notify);
  return () => {
    window.removeEventListener(EVENT, notify);
    window.removeEventListener("storage", notify);
  };
}
export function useSanctionAccess() {
  return useSyncExternalStore(subscribe, hasSanctionAccess, () => false);
}
