import type { CommentView } from "@/lib/api";
import { texts } from "@/texts";
import { formatRelativeTime } from "@/utils/time";

import { RichText } from "@/components/rich-text";
import { UserAvatar } from "@/components/user-avatar";

import { CommentReactionPicker } from "./comment-reaction-picker";
import { useCommentReaction } from "./use-comment-reaction";

export function PostCommentItem({ comment, replyingTo, currentUserId, onDelete, onReply }: {
  comment: CommentView;
  replyingTo?: string;
  currentUserId?: string;
  onDelete?: (commentId: string) => void;
  onReply?: (comment: CommentView) => void;
}) {
  const { reaction, react } = useCommentReaction(comment);
  const canDelete = currentUserId === comment.authorId && onDelete;

  return (
    <div className="flex gap-2.5">
      <UserAvatar src={comment.authorAvatar} alt={comment.authorName} className="h-8 w-8 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="rounded-xl bg-surface-1 px-3 py-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[12px] font-medium text-text-strong">{comment.authorName}</span>
            {replyingTo && (
              <span className="text-[11px] font-light text-text-subtle">{texts.posts.comments.replyingTo(replyingTo)}</span>
            )}
            <span className="text-[11px] font-light text-text-subtle">{formatRelativeTime(comment.createdAt)}</span>
          </div>
          <p className="mt-0.5 break-words text-[13px] font-light leading-relaxed text-text-strong">
            <RichText text={comment.content} />
          </p>
        </div>
        <div className="mt-1 flex items-center gap-3 px-3 text-[11px] font-light text-text-subtle">
          <button type="button" onClick={() => onReply?.(comment)} className="transition-colors hover:text-primary">
            {texts.posts.comments.reply}
          </button>
          <CommentReactionPicker reaction={reaction} onReaction={react} />
          {canDelete && (
            <button type="button" onClick={() => onDelete(comment.id)} className="text-destructive transition-colors hover:text-destructive/80">
              {texts.posts.comments.delete}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
