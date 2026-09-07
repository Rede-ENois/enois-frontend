import type { CommentView } from "@/types/application/comment/comment-view";

import { apiRequest } from "@/lib/api-request";

export function createComment(
  postId: string,
  content: string,
  parentCommentId?: string | null,
  mentionedUserIds?: string[],
) {
  return apiRequest<CommentView>(
    "POST",
    `/feed/posts/${postId}/comments`,
    {
      content,
      parentCommentId: parentCommentId ?? null,
      mentionedUserIds: mentionedUserIds ?? [],
    },
    { idempotent: true },
  );
}
