import type { BulkDeleteInput } from "@/types/application/feed/bulk-delete-input";
import type { BulkDeleteResult } from "@/types/application/feed/bulk-delete-result";
import type { CreatePostInput } from "@/types/application/feed/create-post-input";
import type { DeleteResult } from "@/types/application/feed/delete-result";
import type { PostView } from "@/types/application/feed/post-view";
import type { ReactionsResponse } from "@/types/application/feed/reactions-response";
import type { PageResponse } from "@/types/application/pagination/page-response";

import { api, buildQuery } from "../api-client";

export type { CreatePostInput } from "@/types/application/feed/create-post-input";
export type { PostView } from "@/types/application/feed/post-view";
export type { PageResponse } from "@/types/application/pagination/page-response";

export const feedApi = {
  list: (cursor?: string | null, limit = 20, tab?: string) =>
    api.get<PageResponse<PostView>>(`/feed${buildQuery({ cursor, limit, tab })}`),

  create: (data: CreatePostInput) => api.post<PostView>("/feed/posts", data),

  listByUser: (username: string, cursor?: string | null, limit = 20) =>
    api.get<PageResponse<PostView>>(`/users/${username}/posts${buildQuery({ cursor, limit })}`),

  listByUserId: (userId: string, cursor?: string | null, limit = 20) =>
    api.get<PageResponse<PostView>>(`/users/${userId}/posts${buildQuery({ cursor, limit })}`),

  delete: (postId: string) => api.delete<DeleteResult>(`/feed/posts/${postId}`),

  listSaved: (cursor?: string | null, limit = 20) =>
    api.get<PageResponse<PostView>>(`/feed/saved${buildQuery({ cursor, limit })}`),

  listReactions: (postId: string) => api.get<ReactionsResponse>(`/feed/posts/${postId}/reactions`),

  bulkDelete: (data: BulkDeleteInput) =>
    api.post<BulkDeleteResult>("/feed/posts/bulk-delete", data),
};
