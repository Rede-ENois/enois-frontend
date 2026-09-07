import type { CreatePostInput } from "@/types/application/feed/create-post-input";
import type { PostView } from "@/types/application/feed/post-view";

import { apiRequest } from "@/lib/api-request";

export function createPost(data: CreatePostInput) {
  return apiRequest<PostView>("POST", "/feed/posts", data, { idempotent: true });
}
