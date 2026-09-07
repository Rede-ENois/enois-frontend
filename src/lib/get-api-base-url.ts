const API_BACKEND = import.meta.env.VITE_API_BACKEND ?? "http://localhost:8081/api";

export function getApiBaseUrl(): string {
  if (typeof window === "undefined") return API_BACKEND;
  if (import.meta.env.DEV) return "/api";
  return API_BACKEND;
}
