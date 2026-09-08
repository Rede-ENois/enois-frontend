import type { CommentItemProps } from "@/types/components/post/comment-item-props";
import { useCommentItemController } from "@/utils/components/post/use-comment-item-controller";

import { CommentItemActions } from "@/components/post-comment-item-actions";
import { CommentItemContent } from "@/components/post-comment-item-content";
import { UserAvatar } from "@/components/user-avatar";

export function CommentItem(props: CommentItemProps) {
  const { comment, replyingTo } = props;
  const controller = useCommentItemController(props);

  return (
    <div className="flex gap-2.5">
      <UserAvatar
        src={comment.authorAvatar}
        alt={comment.authorName}
        className="h-8 w-8 shrink-0"
      />

      <div className="min-w-0 flex-1">
        <CommentItemContent
          comment={comment}
          replyingTo={replyingTo}
          timeLabel={controller.timeLabel}
        />
        <CommentItemActions
          showDelete={controller.showDelete}
          onReply={controller.reply}
          onRemove={controller.remove}
          reactionLabel={controller.reactionLabel}
          reactionOptions={controller.reactionOptions}
        />
      </div>
    </div>
  );
}
