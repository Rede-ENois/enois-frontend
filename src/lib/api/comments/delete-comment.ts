import type { StatusResponse } from "@/types/application/api/status-response";

import { apiRequest } from "@/lib/api-request";

export function deleteComment(postId: string, commentId: string) {
  return apiRequest<StatusResponse>("DELETE", `/feed/posts/${postId}/comments/${commentId}`, null, {
    idempotent: true,
  });
}
