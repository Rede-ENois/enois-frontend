import type { ActionResponse } from "@/types/application/reaction/action-response";

import { apiRequest } from "@/lib/api-request";

export function share(postId: string) {
  return apiRequest<ActionResponse>("POST", `/feed/posts/${postId}/shares`, undefined, {
    idempotent: true,
  });
}
