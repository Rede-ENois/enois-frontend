import type { PageResponse } from "@/types/application/api/page-response";
import type { FeedTab } from "@/types/application/feed/feed-tab";
import type { PostView } from "@/types/application/feed/post-view";
import { buildQuery } from "@/utils/build-query";

import { apiRequest } from "@/lib/api-request";

export function listFeedPosts(cursor?: string | null, limit = 20, tab?: FeedTab) {
  return apiRequest<PageResponse<PostView>>(
    "GET",
    `/feed${buildQuery({ cursor, limit, tab })}`,
  );
}
