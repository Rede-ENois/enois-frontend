import type { ApiRequestMethod } from "@/types/application/api/api-request-method";
import type { RequestOptions } from "@/types/application/api/request-options";

import { buildApiRequestHeaders } from "@/lib/build-api-request-headers";
import { createApiNetworkError } from "@/lib/create-api-network-error";
import { parseApiResponse } from "@/lib/parse-api-response";
import { refreshApiRequestSession } from "@/lib/refresh-api-request-session";
import { sendApiRequest } from "@/lib/send-api-request";

export async function apiRequest<T>(
  method: ApiRequestMethod,
  path: string,
  body?: unknown,
  options?: RequestOptions,
): Promise<T> {
  const headers = buildApiRequestHeaders(options);

  let response: Response;
  try {
    response = await sendApiRequest(method, path, body, headers);
  } catch {
    throw createApiNetworkError(path);
  }

  const retry = await refreshApiRequestSession(response, method, path, body, headers);
  return parseApiResponse<T>(retry ?? response, path);
}
