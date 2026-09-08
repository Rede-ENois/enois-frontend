import type { RequestOptions } from "@/types/application/api/request-options";
import { randomUUID } from "@/utils/random-uuid";

import { getSessionToken } from "@/lib/auth/session/get-session-token";

export function buildApiRequestHeaders(options?: RequestOptions) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const sessionToken = getSessionToken();

  if (sessionToken) headers["X-Session-Token"] = sessionToken;
  if (options?.idempotent) headers["Idempotency-Key"] = randomUUID();

  return headers;
}
