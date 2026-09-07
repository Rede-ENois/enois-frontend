import { useState } from "react";

import { REACTION_EMOJIS } from "@/constants/reaction-emojis";
import { texts } from "@/texts";
import type { ReactionType } from "@/types/application/reaction/reaction-type";
import type { CommentItemProps } from "@/types/components/post/comment-item-props";
import { formatRelativeTime } from "@/utils/format-relative-time";

import { usePostCardStore } from "@/stores/post-card.store";
import { deleteComment } from "@/lib/api/comments/delete-comment";
import { getProfileById } from "@/lib/api/profile/get-profile-by-id";
import { react } from "@/lib/api/reactions";
import { removeReaction } from "@/lib/api/reactions/remove-reaction";
import { getCurrentUserId } from "@/lib/get-current-user-id";

export function useCommentItemController({ comment }: CommentItemProps) {
  const currentUserId = getCurrentUserId();
  const postId = comment.postId;
  const setDraft = usePostCardStore((state) => state.setDraft);
  const setCommentMentions = usePostCardStore((state) => state.setCommentMentions);
  const setReplyToId = usePostCardStore((state) => state.setReplyToId);
  const removeComment = usePostCardStore((state) => state.removeComment);
  const updateCommentCount = usePostCardStore((state) => state.updateCommentCount);
  const [commentReaction, setCommentReaction] = useState<ReactionType | null>(null);

  const reply = async () => {
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

  const remove = async () => {
    try {
      await deleteComment(postId, comment.id);
      removeComment(postId, comment.id);
      updateCommentCount(postId, -1);
    } catch {
      // Preserve the existing silent failure behavior.
    }
  };

  const reactToComment = async (type: ReactionType) => {
    try {
      if (commentReaction === type) {
        await removeReaction(comment.postId, comment.id);
        setCommentReaction(null);
      } else {
        await react(comment.postId, type, comment.id);
        setCommentReaction(type);
      }
    } catch {
      // Preserve the existing silent failure behavior.
    }
  };

  return {
    timeLabel: formatRelativeTime(comment.createdAt),
    showDelete: currentUserId === comment.authorId,
    reply,
    remove,
    reactionLabel: commentReaction
      ? REACTION_EMOJIS[commentReaction]
      : texts.posts.reactions.react,
    reactionOptions: (Object.entries(REACTION_EMOJIS) as [ReactionType, string][]).map(
      ([type, emoji]) => ({
        type,
        emoji,
        selected: commentReaction === type,
        react: () => reactToComment(type),
      }),
    ),
  };
}
