import type { ApiRequestMethod } from "@/types/application/api/api-request-method";

import { getApiBaseUrl } from "@/lib/get-api-base-url";

export function sendApiRequest(
  method: ApiRequestMethod,
  path: string,
  body: unknown,
  headers: Record<string, string>,
) {
  return fetch(`${getApiBaseUrl()}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}
