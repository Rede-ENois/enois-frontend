import { Heart } from "lucide-react";

import { REACTION_EMOJIS } from "@/lib/api";
import type { ReactionType } from "@/lib/api";
import { texts } from "@/texts";
import type { PostReactionActionProps } from "@/types/components/post/post-reaction-action-props";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function PostReactionAction({
  currentReaction,
  onReaction,
}: PostReactionActionProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 transition hover:bg-muted hover:text-foreground ${currentReaction ? "text-primary" : ""}`}
          title={currentReaction ? texts.posts.reactions.reactedWith(REACTION_EMOJIS[currentReaction]) : texts.posts.reactions.react}
        >
          {currentReaction ? <span className="text-base leading-none">{REACTION_EMOJIS[currentReaction]}</span> : <Heart className="h-4 w-4" />}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" side="top" className="w-fit rounded-2xl border-border p-1.5">
        <div className="flex gap-1">
          {(Object.entries(REACTION_EMOJIS) as [ReactionType, string][]).map(([type, emoji]) => (
            <button
              key={type}
              type="button"
              onClick={() => onReaction(type)}
              className={`rounded-lg px-2 py-1 text-xl transition hover:bg-muted ${currentReaction === type ? "bg-muted ring-1 ring-primary" : ""}`}
              title={type.toLowerCase()}
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
