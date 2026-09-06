import type { CommentView } from "@/types/application/comment/comment-view";
import type { PageResponse } from "@/types/application/pagination/page-response";

import { api, buildQuery } from "../api-client";

export type { CommentView } from "@/types/application/comment/comment-view";

export const commentApi = {
  create: (
    postId: string,
    content: string,
    parentCommentId?: string | null,
    mentionedUserIds?: string[],
  ) =>
    api.post<CommentView>(`/feed/posts/${postId}/comments`, {
      content,
      parentCommentId: parentCommentId ?? null,
      mentionedUserIds: mentionedUserIds ?? [],
    }),

  list: (postId: string, cursor?: string | null, limit = 20) =>
    api.get<PageResponse<CommentView>>(
      `/feed/posts/${postId}/comments${buildQuery({ cursor, limit })}`,
    ),

  remove: (postId: string, commentId: string) =>
    api.delete<{ status: string }>(`/feed/posts/${postId}/comments/${commentId}`),
};
