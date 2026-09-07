import type { ActionResponse } from "@/types/application/reaction/action-response";

import { apiRequest } from "@/lib/api-request";

export function save(postId: string) {
  return apiRequest<ActionResponse>("POST", `/feed/posts/${postId}/saves`, undefined, {
    idempotent: true,
  });
}
