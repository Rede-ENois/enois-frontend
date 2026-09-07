import type { RequestOptions } from "@/types/application/api/request-options";
import { randomUUID } from "@/utils/random-uuid";

import { ApiError } from "./api-client";
import { clearAuthSession } from "./auth-session/clear-auth-session";
import { getSessionToken } from "./auth-session/get-session-token";
import { getApiBaseUrl } from "./get-api-base-url";
import { refreshAuthSession } from "./refresh-auth-session";

let isRefreshing = false;

export async function apiRequest<T>(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
  body?: unknown,
  options?: RequestOptions,
): Promise<T> {
  const sessionToken = getSessionToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  if (sessionToken) headers["X-Session-Token"] = sessionToken;
  if (options?.idempotent) headers["Idempotency-Key"] = randomUUID();

  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, {
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
    const refreshed = await refreshAuthSession();
    isRefreshing = false;

    if (refreshed) {
      headers["X-Session-Token"] = getSessionToken() ?? "";
      const retry = await fetch(`${getApiBaseUrl()}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (retry.ok) {
        if (retry.status === 204 || retry.headers.get("content-length") === "0") {
          return undefined as T;
        }

        const retryData = await retry.json();
        return retryData?.body !== undefined ? (retryData.body as T) : (retryData as T);
      }
    }

    clearAuthSession();
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
