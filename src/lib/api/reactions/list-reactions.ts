import type { ReactionsListResponse } from "@/types/application/reaction/reactions-list-response";

import { apiRequest } from "@/lib/api-request";

export function listReactions(postId: string, commentId?: string) {
  const path = commentId
    ? `/feed/posts/${postId}/comments/${commentId}/reactions`
    : `/feed/posts/${postId}/reactions`;

  return apiRequest<ReactionsListResponse>("GET", path);
}
