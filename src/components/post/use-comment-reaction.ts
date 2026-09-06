import { useState } from "react";

import { reactionApi } from "@/lib/api";
import type { CommentView, ReactionType } from "@/lib/api";

export function useCommentReaction(comment: CommentView) {
  const [currentReaction, setCurrentReaction] = useState<string | null>(null);

  const handleReaction = async (type: ReactionType) => {
    try {
      const isRemovingReaction = currentReaction === type;
      if (isRemovingReaction) {
        await reactionApi.removeCommentReaction(comment.postId, comment.id);
      } else {
        await reactionApi.reactToComment(comment.postId, comment.id, type);
      }
      setCurrentReaction(isRemovingReaction ? null : type);
    } catch {
      // Keep the existing silent-failure behavior.
    }
  };

  return { currentReaction, handleReaction };
}
