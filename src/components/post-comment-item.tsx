import { useCommentItemContext } from "@/utils/components/post/use-comment-item-context";

import { CommentItemActions } from "@/components/post-comment-item-actions";
import { CommentItemContent } from "@/components/post-comment-item-content";
import { UserAvatar } from "@/components/user-avatar";

export function CommentItem() {
  const { comment } = useCommentItemContext();

  return (
    <div className="flex gap-2.5">
      <UserAvatar
        src={comment.authorAvatar}
        alt={comment.authorName}
        className="h-8 w-8 shrink-0"
      />

      <div className="min-w-0 flex-1">
        <CommentItemContent />
        <CommentItemActions />
      </div>
    </div>
  );
}
