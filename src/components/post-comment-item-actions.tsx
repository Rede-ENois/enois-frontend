import { Root as Popover, Trigger as PopoverTrigger } from "@radix-ui/react-popover";

import { texts } from "@/texts";
import type { CommentItemActionsProps } from "@/types/components/post/comment-item-actions-props";

import { PopoverContent } from "@/components/ui/popover-content";

export function CommentItemActions({
  showDelete,
  onReply,
  onRemove,
  reactionLabel,
  reactionOptions,
}: CommentItemActionsProps) {
  return (
    <div className="mt-1 flex items-center gap-3 px-3 text-[11px] font-light text-text-subtle">
      <button onClick={onReply} className="transition-colors hover:text-primary">
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
          onClick={onRemove}
          className="text-destructive transition-colors hover:text-destructive/80"
        >
          {texts.posts.comments.delete}
        </button>
      )}
    </div>
  );
}
