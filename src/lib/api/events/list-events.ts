import type { PageResponse } from "@/types/application/api/page-response";
import type { Event } from "@/types/application/event/event";
import { buildQuery } from "@/utils/build-query";

import { apiRequest } from "@/lib/api-request";

export function listEvents(format?: string, cursor?: string | null, limit = 20) {
  return apiRequest<PageResponse<Event>>(
    "GET",
    `/events${buildQuery({ format, cursor, limit })}`,
  );
}
