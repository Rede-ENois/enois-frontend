import type { PageResponse } from "@/types/application/api/page-response";
import type { Mentor } from "@/types/application/mentor/mentor";
import { buildQuery } from "@/utils/build-query";

import { apiRequest } from "@/lib/api-request";

export function listMentors(expertise?: string, cursor?: string | null, limit = 20) {
  return apiRequest<PageResponse<Mentor>>(
    "GET",
    `/mentors${buildQuery({ expertise, cursor, limit })}`,
  );
}
