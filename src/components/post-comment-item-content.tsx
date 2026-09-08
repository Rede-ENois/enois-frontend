import { useCommentItemContext } from "@/utils/components/post/use-comment-item-context";
import { linkifyText } from "@/utils/linkify-text";

export function CommentItemContent() {
  const { comment, replyingToLabel, timeLabel } = useCommentItemContext();

  return (
    <div className="rounded-xl bg-surface-1 px-3 py-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[12px] font-medium text-text-strong">{comment.authorName}</span>
        {replyingToLabel && (
          <span className="text-[11px] font-light text-text-subtle">{replyingToLabel}</span>
        )}
        <span className="text-[11px] font-light text-text-subtle">{timeLabel}</span>
      </div>

      <p className="mt-0.5 break-words text-[13px] font-light leading-relaxed text-text-strong">
        {linkifyText(comment.content)}
      </p>
    </div>
  );
}
