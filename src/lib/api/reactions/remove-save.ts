import type { ActionResponse } from "@/types/application/reaction/action-response";

import { apiRequest } from "@/lib/api-request";

export function removeSave(postId: string) {
  return apiRequest<ActionResponse>("DELETE", `/feed/posts/${postId}/saves`, null, {
    idempotent: true,
  });
}
