import { usePostCardStore } from "@/stores/post-card.store";
import type { PostCardProps } from "@/types/components/post/post-card-props";

import { usePostReaction } from "@/lib/use-post-reaction";
import { usePostSave } from "@/lib/use-post-save";
import { usePostShare } from "@/lib/use-post-share";

import { createPostReactionActionViewModel } from "@/utils/components/post/create-post-reaction-action-view-model";
import { usePostActionsComments } from "@/utils/components/post/use-post-actions-comments";
import { usePostActionsDialogs } from "@/utils/components/post/use-post-actions-dialogs";

export function usePostActionsController({ post }: PostCardProps) {
  const card = usePostCardStore((state) => state.cards[post.id]);
  const { reactionStatus, reactToPost } = usePostReaction(post);
  const { saved, toggleSave } = usePostSave(post.id);
  const sharePost = usePostShare(post.id);
  const reaction = createPostReactionActionViewModel(reactionStatus, reactToPost);
  const comments = usePostActionsComments();
  const dialogs = usePostActionsDialogs(post.id);

  return {
    postCounters: card?.postCounters ?? post.counters,
    ...reaction,
    ...comments,
    ...dialogs,
    sharePost,
    saved,
    toggleSave,
  };
}
