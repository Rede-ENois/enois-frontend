import { useState } from "react";

import { REACTION_EMOJIS } from "@/constants/reaction-emojis";
import { usePostCardStore } from "@/stores/post-card.store";
import { texts } from "@/texts";
import type { ReactionType } from "@/types/application/reaction/reaction-type";
import type { PostCardProps } from "@/types/components/post/post-card-props";

import { usePostReaction } from "@/lib/use-post-reaction";
import { usePostSave } from "@/lib/use-post-save";
import { usePostShare } from "@/lib/use-post-share";

export function usePostActionsController({ post }: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const card = usePostCardStore((state) => state.cards[post.id]);
  const setShowReactions = usePostCardStore((state) => state.setShowReactions);
  const setShowReport = usePostCardStore((state) => state.setShowReport);
  const { reactionStatus, reactToPost } = usePostReaction(post);
  const { saved, toggleSave } = usePostSave(post.id);
  const sharePost = usePostShare(post.id);
  const reactionEmoji = reactionStatus ? REACTION_EMOJIS[reactionStatus] : null;

  return {
    postCounters: card?.postCounters ?? post.counters,
    reactionActive: Boolean(reactionStatus),
    reactionEmoji,
    reactionTitle: reactionEmoji
      ? texts.posts.reactions.reactedWith(reactionEmoji)
      : texts.posts.reactions.react,
    reactionOptions: (Object.entries(REACTION_EMOJIS) as [ReactionType, string][]).map(
      ([type, emoji]) => ({
        type,
        emoji,
        selected: reactionStatus === type,
        title: type.toLowerCase(),
        react: () => reactToPost(type),
      }),
    ),
    openReactions: () => setShowReactions(post.id, true),
    showComments,
    toggleComments: () => setShowComments((visible) => !visible),
    sharePost,
    openReport: () => setShowReport(post.id, true),
    saved,
    toggleSave,
  };
}
