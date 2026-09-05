import {
  clearSession,
  getRefreshToken,
  getSessionToken,
  storeSessionTokens,
} from "@/utils/session";
import { randomUUID } from "@/utils/uuid";

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
  return token ? { "X-Session-Token": token } : {};
}

function idemKey(): Record<string, string> {
  return { "Idempotency-Key": randomUUID() };
}

let isRefreshing = false;

async function tryRefreshToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${baseUrl()}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      clearSession();
      return false;
    }

    const data = await response.json();
    const body = data?.body ?? data;
    storeSessionTokens({
      token: body.token,
      refreshToken: body.refreshToken,
      expiresAt: body.expiresAt,
      refreshExpiresAt: body.refreshExpiresAt,
    });
    return true;
  } catch {
    return false;
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  opts?: { idempotent?: boolean },
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...authHeaders(),
  };

  if (opts?.idempotent) Object.assign(headers, idemKey());

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

  const shouldRefresh =
    (response.status === 401 || response.status === 403) &&
    !isRefreshing &&
    Boolean(headers["X-Session-Token"]) &&
    !path.startsWith("/auth/");

  if (shouldRefresh) {
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
        return data?.body !== undefined ? (data.body as T) : (data as T);
      }
    }

    clearSession();
    if (typeof window !== "undefined") window.location.href = "/entrar?tab=login";

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
  return data?.body !== undefined ? (data.body as T) : (data as T);
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
  const stringified = search.toString();
  return stringified ? `?${stringified}` : "";
}

export { getSessionToken } from "@/utils/session";
