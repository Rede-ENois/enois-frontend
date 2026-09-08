import { texts } from "@/texts";
import { useCommentItemContext } from "@/utils/components/post/use-comment-item-context";
import { linkifyText } from "@/utils/linkify-text";

export function CommentItemContent() {
  const { comment, replyingTo, timeLabel } = useCommentItemContext();

  return (
    <div className="rounded-xl bg-surface-1 px-3 py-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[12px] font-medium text-text-strong">{comment.authorName}</span>
        {replyingTo && (
          <span className="text-[11px] font-light text-text-subtle">
            {texts.posts.comments.replyingTo(replyingTo)}
          </span>
        )}
        <span className="text-[11px] font-light text-text-subtle">{timeLabel}</span>
      </div>

      <p className="mt-0.5 break-words text-[13px] font-light leading-relaxed text-text-strong">
        {linkifyText(comment.content)}
      </p>
    </div>
  );
}
