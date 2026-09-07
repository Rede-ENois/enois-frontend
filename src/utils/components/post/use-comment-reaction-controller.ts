import { useState } from "react";

import type { CommentView } from "@/types/application/comment/comment-view";
import type { ReactionType } from "@/types/application/reaction/reaction-type";

import { react } from "@/lib/api/reactions";
import { removeReaction } from "@/lib/api/reactions/remove-reaction";

export function useCommentReactionController(comment: CommentView) {
  const [reaction, setReaction] = useState<ReactionType | null>(null);

  const toggle = async (type: ReactionType) => {
    try {
      if (reaction === type) {
        await removeReaction(comment.postId, comment.id);
        setReaction(null);
      } else {
        await react(comment.postId, type, comment.id);
        setReaction(type);
      }
    } catch {
      // Preserve the existing silent failure behavior.
    }
  };

  return { reaction, toggle };
}
