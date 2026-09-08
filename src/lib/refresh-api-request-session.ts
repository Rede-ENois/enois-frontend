import type { ApiRequestMethod } from "@/types/application/api/api-request-method";

import { ApiError } from "@/lib/api-client";
import { expireAuthSession } from "@/lib/auth/expire-auth-session";
import { refreshAuthSession } from "@/lib/auth/refresh-auth-session";
import { getSessionToken } from "@/lib/auth/session/get-session-token";
import { sendApiRequest } from "@/lib/send-api-request";
import { shouldRefreshApiRequestSession } from "@/lib/should-refresh-api-request-session";

let isRefreshing = false;

export async function refreshApiRequestSession(
  response: Response,
  method: ApiRequestMethod,
  path: string,
  body: unknown,
  headers: Record<string, string>,
): Promise<Response | null> {
  if (!shouldRefreshApiRequestSession(response.status, path, headers, isRefreshing)) return null;

  isRefreshing = true;
  const refreshed = await refreshAuthSession();
  isRefreshing = false;

  if (refreshed) {
    headers["X-Session-Token"] = getSessionToken() ?? "";
    const retry = await sendApiRequest(method, path, body, headers);
    if (retry.ok) return retry;
  }

  expireAuthSession();

  throw new ApiError(
    response.status,
    "SESSION_EXPIRED",
    "Sessão expirada. Faça login novamente.",
    path,
  );
}
