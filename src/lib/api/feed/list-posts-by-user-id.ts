import type { PageResponse } from "@/types/application/api/page-response";
import type { PostView } from "@/types/application/feed/post-view";
import { buildQuery } from "@/utils/build-query";

import { apiRequest } from "@/lib/api-request";

export function listPostsByUserId(userId: string, cursor?: string | null, limit = 20) {
  return apiRequest<PageResponse<PostView>>(
    "GET",
    `/users/${userId}/posts${buildQuery({ cursor, limit })}`,
  );
}
