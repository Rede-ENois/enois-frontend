import { REACTION_EMOJIS } from "@/lib/api";
import type { ReactionType } from "@/lib/api";
import { texts } from "@/texts";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type CommentReactionPickerProps = {
  currentReaction: string | null;
  onReaction: (type: ReactionType) => void;
};

export function CommentReactionPicker({
  currentReaction,
  onReaction,
}: CommentReactionPickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="transition-colors hover:text-primary">
          {currentReaction ? REACTION_EMOJIS[currentReaction] : texts.posts.reactions.react}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" side="top" className="w-fit rounded-2xl border-border-soft bg-surface-card p-1.5">
        <div className="flex gap-1">
          {(Object.entries(REACTION_EMOJIS) as [ReactionType, string][]).map(([type, emoji]) => (
            <button
              key={type}
              type="button"
              onClick={() => onReaction(type)}
              className={`rounded-lg px-2 py-1 text-lg transition hover:bg-surface-2 ${currentReaction === type ? "bg-surface-2 ring-1 ring-primary" : ""}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
