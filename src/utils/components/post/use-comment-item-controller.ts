import type { CommentItemProps } from "@/types/components/post/comment-item-props";
import { formatRelativeTime } from "@/utils/format-relative-time";

import { getCurrentUserId } from "@/lib/get-current-user-id";

import { createCommentReactionViewModel } from "@/utils/components/post/create-comment-reaction-view-model";
import { useCommentDeleteAction } from "@/utils/components/post/use-comment-delete-action";
import { useCommentReactionController } from "@/utils/components/post/use-comment-reaction-controller";
import { useCommentReplyAction } from "@/utils/components/post/use-comment-reply-action";

export function useCommentItemController({ comment }: CommentItemProps) {
  const reply = useCommentReplyAction(comment);
  const remove = useCommentDeleteAction(comment);
  const reaction = useCommentReactionController(comment);
  const reactionView = createCommentReactionViewModel(reaction.reaction, reaction.toggle);

  return {
    timeLabel: formatRelativeTime(comment.createdAt),
    showDelete: getCurrentUserId() === comment.authorId,
    reply,
    remove,
    reactionLabel: reactionView.label,
    reactionOptions: reactionView.options,
  };
}
