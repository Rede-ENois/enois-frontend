export function getAuthStorage() {
  return typeof window === "undefined" ? null : localStorage;
}
