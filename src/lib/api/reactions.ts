import type { ActionResponse } from "@/types/application/reaction/action-response";
import type { ReactionType } from "@/types/application/reaction/reaction-type";

import { apiRequest } from "@/lib/api-request";

export function react(postId: string, type: ReactionType, commentId?: string) {
  const path = commentId
    ? `/feed/posts/${postId}/comments/${commentId}/reactions`
    : `/feed/posts/${postId}/reactions`;

  return apiRequest<Partial<ActionResponse>>("POST", path, { type }, { idempotent: true });
}
