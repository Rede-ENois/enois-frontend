import type { PageResponse } from "@/types/application/api/page-response";
import type { StatusResponse } from "@/types/application/api/status-response";
import type { CommentView } from "@/types/application/comment/comment-view";
import { buildQuery } from "@/utils/build-query";

import { apiRequest } from "../api-request";

export const commentsApi = {
  create: (postId: string, content: string, parentCommentId?: string | null, mentionedUserIds?: string[]) =>
    apiRequest<CommentView>("POST", `/feed/posts/${postId}/comments`, {
      content,
      parentCommentId: parentCommentId ?? null,
      mentionedUserIds: mentionedUserIds ?? [],
    }, { idempotent: true }),
  list: (postId: string, cursor?: string | null, limit = 20) =>
    apiRequest<PageResponse<CommentView>>("GET", `/feed/posts/${postId}/comments${buildQuery({ cursor, limit })}`),
  remove: (postId: string, commentId: string) =>
    apiRequest<StatusResponse>("DELETE", `/feed/posts/${postId}/comments/${commentId}`, null, { idempotent: true }),
};
