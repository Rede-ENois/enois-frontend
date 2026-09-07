import { texts } from "@/texts";
import type { CommentItemProps } from "@/types/components/post/comment-item-props";
import { linkifyText } from "@/utils/linkify-text";
import { Root as Popover, Trigger as PopoverTrigger } from "@radix-ui/react-popover";

import { useCommentItemController } from "@/utils/components/post/use-comment-item-controller";

import { PopoverContent } from "@/components/ui/popover-content";

import { UserAvatar } from "@/components/user-avatar";

export function CommentItem(props: CommentItemProps) {
  const { comment, replyingTo } = props;
  const { timeLabel, showDelete, reply, remove, reactionLabel, reactionOptions } =
    useCommentItemController(props);

  return (
    <div className="flex gap-2.5">
      <UserAvatar
        src={comment.authorAvatar}
        alt={comment.authorName}
        className="h-8 w-8 shrink-0"
      />

      <div className="min-w-0 flex-1">
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

        <div className="mt-1 flex items-center gap-3 px-3 text-[11px] font-light text-text-subtle">
          <button onClick={reply} className="transition-colors hover:text-primary">
            {texts.posts.comments.reply}
          </button>

          <Popover>
            <PopoverTrigger asChild>
              <button className="transition-colors hover:text-primary">{reactionLabel}</button>
            </PopoverTrigger>

            <PopoverContent
              align="start"
              side="top"
              className="w-fit rounded-2xl border-border-soft bg-surface-card p-1.5"
            >
              <div className="flex gap-1">
                {reactionOptions.map((option) => (
                  <button
                    key={option.type}
                    onClick={option.react}
                    className={`rounded-lg px-2 py-1 text-lg transition hover:bg-surface-2 ${
                      option.selected ? "bg-surface-2 ring-1 ring-primary" : ""
                    }`}
                  >
                    {option.emoji}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          {showDelete && (
            <button
              onClick={remove}
              className="text-destructive transition-colors hover:text-destructive/80"
            >
              {texts.posts.comments.delete}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
