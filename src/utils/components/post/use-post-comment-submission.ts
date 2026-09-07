import type { CommentView } from "@/types/application/comment/comment-view";

import { createComment } from "@/lib/api/comments/create-comment";

export function usePostCommentSubmission(
  postId: string,
  draft: string,
  replyToId: string | null,
  mentionedUserIds: string[],
  complete: (comment: CommentView) => void,
) {
  return async () => {
    const content = draft.trim();
    if (!content) return;

    try {
      complete(await createComment(postId, content, replyToId, mentionedUserIds));
    } catch {
      // Preserve the existing silent failure behavior.
    }
  };
}
