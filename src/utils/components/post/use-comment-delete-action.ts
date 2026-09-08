import { usePostCardStore } from "@/stores/post-card.store";
import type { CommentView } from "@/types/application/comment/comment-view";

import { deleteComment } from "@/lib/api/comments/delete-comment";

export function useCommentDeleteAction(comment: CommentView) {
  const removeComment = usePostCardStore((state) => state.removeComment);
  const updateCommentCount = usePostCardStore((state) => state.updateCommentCount);

  return async () => {
    try {
      await deleteComment(comment.postId, comment.id);
      removeComment(comment.postId, comment.id);
      updateCommentCount(comment.postId, -1);
    } catch {
      // Preserve the existing silent failure behavior.
    }
  };
}
