import type { PageResponse } from "@/types/application/api/page-response";
import type { BulkDeleteInput } from "@/types/application/feed/bulk-delete-input";
import type { BulkDeleteResult } from "@/types/application/feed/bulk-delete-result";
import type { CreatePostInput } from "@/types/application/feed/create-post-input";
import type { DeleteResult } from "@/types/application/feed/delete-result";
import type { FeedTab } from "@/types/application/feed/feed-tab";
import type { PostView } from "@/types/application/feed/post-view";
import type { ReactionsResponse } from "@/types/application/feed/reactions-response";
import { buildQuery } from "@/utils/build-query";

import { apiRequest } from "../api-request";

export const feedApi = {
  list: (cursor?: string | null, limit = 20, tab?: FeedTab) => apiRequest<PageResponse<PostView>>("GET", `/feed${buildQuery({ cursor, limit, tab })}`),
  create: (data: CreatePostInput) => apiRequest<PostView>("POST", "/feed/posts", data, { idempotent: true }),
  listByUser: (username: string, cursor?: string | null, limit = 20) => apiRequest<PageResponse<PostView>>("GET", `/users/${username}/posts${buildQuery({ cursor, limit })}`),
  listByUserId: (userId: string, cursor?: string | null, limit = 20) => apiRequest<PageResponse<PostView>>("GET", `/users/${userId}/posts${buildQuery({ cursor, limit })}`),
  delete: (postId: string) => apiRequest<DeleteResult>("DELETE", `/feed/posts/${postId}`, null, { idempotent: true }),
  listSaved: (cursor?: string | null, limit = 20) => apiRequest<PageResponse<PostView>>("GET", `/feed/saved${buildQuery({ cursor, limit })}`),
  listReactions: (postId: string) => apiRequest<ReactionsResponse>("GET", `/feed/posts/${postId}/reactions`),
  bulkDelete: (data: BulkDeleteInput) => apiRequest<BulkDeleteResult>("POST", "/feed/posts/bulk-delete", data, { idempotent: true }),
};
