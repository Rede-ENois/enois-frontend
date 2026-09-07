import type { PageResponse } from "@/types/application/api/page-response";
import type { Community } from "@/types/application/community/community";
import type { CommunityTopic } from "@/types/application/community/community-topic";
import { buildQuery } from "@/utils/build-query";

import { apiRequest } from "@/lib/api-request";

export function listCommunities(topic?: CommunityTopic, cursor?: string | null, limit = 20) {
  return apiRequest<PageResponse<Community>>(
    "GET",
    `/communities${buildQuery({ topic, cursor, limit })}`,
  );
}
