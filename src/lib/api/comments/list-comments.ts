import type { PageResponse } from "@/types/application/api/page-response";
import type { CommentView } from "@/types/application/comment/comment-view";
import { buildQuery } from "@/utils/build-query";

import { apiRequest } from "@/lib/api-request";

export function listComments(postId: string, cursor?: string | null, limit = 20) {
  return apiRequest<PageResponse<CommentView>>(
    "GET",
    `/feed/posts/${postId}/comments${buildQuery({ cursor, limit })}`,
  );
}
