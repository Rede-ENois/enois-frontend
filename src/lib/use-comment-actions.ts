import { useState } from "react";

import { deleteComment } from "@/lib/api/comments/delete-comment";
import { getProfileById } from "@/lib/api/profile/get-profile-by-id";
import { react } from "@/lib/api/reactions";
import { removeReaction } from "@/lib/api/reactions/remove-reaction";
import { getCurrentUserId } from "@/lib/get-current-user-id";
import { usePostCardStore } from "@/stores/post-card.store";
import type { CommentView } from "@/types/application/comment/comment-view";
import type { ReactionType } from "@/types/application/reaction/reaction-type";

export function useCommentActions(comment: CommentView) {
  const currentUserId = getCurrentUserId();
  const postId = comment.postId;
  const setDraft = usePostCardStore((state) => state.setDraft);
  const setCommentMentions = usePostCardStore((state) => state.setCommentMentions);
  const setReplyToId = usePostCardStore((state) => state.setReplyToId);
  const removeComment = usePostCardStore((state) => state.removeComment);
  const updateCommentCount = usePostCardStore((state) => state.updateCommentCount);
  const [commentReaction, setCommentReaction] = useState<ReactionType | null>(null);

  const handleReply = async () => {
    try {
      const profile = await getProfileById(comment.authorId);
      if (profile?.username) {
        setDraft(postId, `@${profile.username} `);
        setCommentMentions(postId, [comment.authorId]);
      }
    } catch {
      setDraft(postId, `${comment.authorName} `);
    }
    setReplyToId(postId, comment.id);
  };

  const handleDelete = async () => {
    try {
      await deleteComment(postId, comment.id);
      removeComment(postId, comment.id);
      updateCommentCount(postId, -1);
    } catch {
      // silently fail
    }
  };

  const handleReaction = async (type: ReactionType) => {
    try {
      if (commentReaction === type) {
        await removeReaction(comment.postId, comment.id);
        setCommentReaction(null);
      } else {
        await react(comment.postId, type, comment.id);
        setCommentReaction(type);
      }
    } catch {
      // silently fail
    }
  };

  return {
    isOwner: currentUserId === comment.authorId,
    commentReaction,
    handleReply,
    handleDelete,
    handleReaction,
  };
}
