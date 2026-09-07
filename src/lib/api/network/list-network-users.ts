import type { PageResponse } from "@/types/application/api/page-response";
import type { NetworkUser } from "@/types/application/network/network-user";
import { buildQuery } from "@/utils/build-query";

import { apiRequest } from "@/lib/api-request";

export function listNetworkUsers(query?: string, cursor?: string | null, limit = 20) {
  return apiRequest<PageResponse<NetworkUser>>(
    "GET",
    `/network/users${buildQuery({ query, cursor, limit })}`,
  );
}
