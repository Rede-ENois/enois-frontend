import type { ApiRequestMethod } from "@/types/application/api/api-request-method";

import { ApiError } from "@/lib/api-client";
import { clearAuthSession } from "@/lib/auth-session/clear-auth-session";
import { getSessionToken } from "@/lib/auth-session/get-session-token";
import { refreshAuthSession } from "@/lib/refresh-auth-session";
import { sendApiRequest } from "@/lib/send-api-request";

let isRefreshing = false;

export async function refreshApiRequestSession(
  response: Response,
  method: ApiRequestMethod,
  path: string,
  body: unknown,
  headers: Record<string, string>,
): Promise<Response | null> {
  if (
    (response.status !== 401 && response.status !== 403) ||
    isRefreshing ||
    !headers["X-Session-Token"] ||
    path.startsWith("/auth/")
  ) {
    return null;
  }

  isRefreshing = true;
  const refreshed = await refreshAuthSession();
  isRefreshing = false;

  if (refreshed) {
    headers["X-Session-Token"] = getSessionToken() ?? "";
    const retry = await sendApiRequest(method, path, body, headers);
    if (retry.ok) return retry;
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
