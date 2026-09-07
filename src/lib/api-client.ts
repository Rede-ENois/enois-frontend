import type { RequestOptions } from "@/types/application/api/request-options";

import { clearAuthSession } from "./auth-session/clear-auth-session";
import { getRefreshToken } from "./auth-session/get-refresh-token";
import { getSessionToken } from "./auth-session/get-session-token";
import { persistAuthTokens } from "./auth-session/persist-auth-tokens";

const API_BACKEND = import.meta.env.VITE_API_BACKEND ?? "http://localhost:8081/api";

function baseUrl(): string {
  if (typeof window === "undefined") return API_BACKEND;
  if (import.meta.env.DEV) return "/api";
  return API_BACKEND;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string | undefined,
    message: string,
    public path?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function authHeaders(): Record<string, string> {
  const token = getSessionToken();
  const headers: Record<string, string> = {};
  if (token) headers["X-Session-Token"] = token;
  return headers;
}

export function randomUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function idemKey(): Record<string, string> {
  return { "Idempotency-Key": randomUUID() };
}

let isRefreshing = false;

async function tryRefreshToken(): Promise<boolean> {
  const token = getRefreshToken();
  if (!token) return false;

  try {
    const response = await fetch(`${baseUrl()}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: token }),
    });

    if (!response.ok) {
      clearAuthSession();
      return false;
    }

    const data = await response.json();
    const body = data?.body ?? data;
    persistAuthTokens(body);
    return true;
  } catch {
    return false;
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  opts?: RequestOptions,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...authHeaders(),
  };

  if (opts?.idempotent) {
    Object.assign(headers, idemKey());
  }

  let response: Response;
  try {
    response = await fetch(`${baseUrl()}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(
      0,
      "NETWORK_ERROR",
      "Não foi possível conectar ao servidor. Verifique sua conexão e se o backend está no ar.",
      path,
    );
  }

  if (
    (response.status === 401 || response.status === 403) &&
    !isRefreshing &&
    headers["X-Session-Token"] &&
    !path.startsWith("/auth/")
  ) {
    isRefreshing = true;
    const refreshed = await tryRefreshToken();
    isRefreshing = false;

    if (refreshed) {
      headers["X-Session-Token"] = getSessionToken() ?? "";
      const retry = await fetch(`${baseUrl()}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (retry.ok) {
        if (retry.status === 204 || retry.headers.get("content-length") === "0") {
          return undefined as T;
        }
        const data = await retry.json();
        if (data?.body !== undefined) return data.body as T;
        return data as T;
      }
    }

    clearAuthSession();
    if (typeof window !== "undefined") {
      window.location.href = "/entrar?tab=login";
    }
    throw new ApiError(
      response.status,
      "SESSION_EXPIRED",
      "Sessão expirada. Faça login novamente.",
      path,
    );
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new ApiError(
      response.status,
      errorBody?.code,
      errorBody?.message ?? response.statusText,
      path,
    );
  }

  if (response.status === 204 || response.headers.get("content-length") === "0") {
    return undefined as T;
  }

  const data = await response.json();

  if (data?.body !== undefined) return data.body as T;
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body, { idempotent: true }),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body, { idempotent: true }),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body, { idempotent: true }),
  delete: <T>(path: string) => request<T>("DELETE", path, null, { idempotent: true }),
};

export function buildQuery(
  params: Record<string, string | number | boolean | null | undefined>,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && value !== "") {
      search.append(key, String(value));
    }
  }
  const str = search.toString();
  return str ? `?${str}` : "";
}
