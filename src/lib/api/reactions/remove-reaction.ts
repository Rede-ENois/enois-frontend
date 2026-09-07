import type { ActionResponse } from "@/types/application/reaction/action-response";

import { apiRequest } from "@/lib/api-request";

export function removeReaction(postId: string, commentId?: string) {
  const path = commentId
    ? `/feed/posts/${postId}/comments/${commentId}/reactions`
    : `/feed/posts/${postId}/reactions`;

  return apiRequest<Partial<ActionResponse>>("DELETE", path, null, { idempotent: true });
}
