import { useState } from "react";

import { reactionsApi } from "@/lib/api";
import type { CommentView, ReactionType } from "@/lib/api";

export function useCommentReaction(comment: CommentView) {
  const [reaction, setReaction] = useState<string | null>(null);

  const react = async (type: ReactionType) => {
    try {
      const removing = reaction === type;
      if (removing) {
        await reactionsApi.removeCommentReaction(comment.postId, comment.id);
      } else {
        await reactionsApi.reactComment(comment.postId, comment.id, type);
      }
      setReaction(removing ? null : type);
    } catch {
      // Keep the existing silent-failure behavior.
    }
  };

  return { reaction, react };
}
