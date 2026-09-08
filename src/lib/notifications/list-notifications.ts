import type { PageResponse } from "@/types/application/api/page-response";
import type { Notification } from "@/types/notifications/notification";
import { buildQuery } from "@/utils/build-query";

import { apiRequest } from "@/lib/api-request";

export function listNotifications(cursor?: string | null, limit = 20) {
  return apiRequest<PageResponse<Notification>>(
    "GET",
    `/notifications${buildQuery({ cursor, limit })}`,
  );
}
