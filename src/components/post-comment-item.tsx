import { Root as Popover, Trigger as PopoverTrigger } from "@radix-ui/react-popover";

import { REACTION_EMOJIS } from "@/constants/reaction-emojis";
import { useCommentActions } from "@/lib/use-comment-actions";
import { texts } from "@/texts";
import type { ReactionType } from "@/types/application/reaction/reaction-type";
import type { CommentItemProps } from "@/types/components/post/comment-item-props";
import { formatRelativeTime } from "@/utils/format-relative-time";
import { linkifyText } from "@/utils/linkify-text";

import { PopoverContent } from "@/components/ui/popover-content";
import { UserAvatar } from "@/components/user-avatar";

export function CommentItem({ comment, replyingTo }: CommentItemProps) {
  const {
    isOwner,
    commentReaction,
    handleReply,
    handleDelete,
    handleReaction,
  } = useCommentActions(comment);

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
            <span className="text-[11px] font-light text-text-subtle">
              {formatRelativeTime(comment.createdAt)}
            </span>
          </div>
          <p className="mt-0.5 break-words text-[13px] font-light leading-relaxed text-text-strong">
            {linkifyText(comment.content)}
          </p>
        </div>
        <div className="mt-1 flex items-center gap-3 px-3 text-[11px] font-light text-text-subtle">
          <button onClick={handleReply} className="transition-colors hover:text-primary">
            {texts.posts.comments.reply}
          </button>
          <Popover>
            <PopoverTrigger asChild>
              <button className="transition-colors hover:text-primary">
                {commentReaction ? REACTION_EMOJIS[commentReaction] : texts.posts.reactions.react}
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              side="top"
              className="w-fit rounded-2xl border-border-soft bg-surface-card p-1.5"
            >
              <div className="flex gap-1">
                {(Object.entries(REACTION_EMOJIS) as [ReactionType, string][]).map(
                  ([type, emoji]) => (
                    <button
                      key={type}
                      onClick={() => handleReaction(type)}
                      className={`rounded-lg px-2 py-1 text-lg transition hover:bg-surface-2 ${
                        commentReaction === type ? "bg-surface-2 ring-1 ring-primary" : ""
                      }`}
                    >
                      {emoji}
                    </button>
                  ),
                )}
              </div>
            </PopoverContent>
          </Popover>
          {isOwner && (
            <button
              onClick={handleDelete}
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
