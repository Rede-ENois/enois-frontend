import { useSyncExternalStore } from "react";

const KEY = "sanction_access";
const EVENT = "enois:sanction-access";
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
