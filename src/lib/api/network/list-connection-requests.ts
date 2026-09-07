import type { PageResponse } from "@/types/application/api/page-response";
import type { ConnectionRequest } from "@/types/application/network/connection-request";
import { buildQuery } from "@/utils/build-query";

import { apiRequest } from "@/lib/api-request";

export function listConnectionRequests(cursor?: string | null, limit = 20) {
  return apiRequest<PageResponse<ConnectionRequest>>(
    "GET",
    `/network/requests${buildQuery({ cursor, limit })}`,
  );
}
