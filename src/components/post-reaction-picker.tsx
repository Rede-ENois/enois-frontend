import { Root as Popover, Trigger as PopoverTrigger } from "@radix-ui/react-popover";
import { Heart } from "lucide-react";

import type { PostReactionPickerProps } from "@/types/components/post/post-reaction-picker-props";

import { PopoverContent } from "@/components/ui/popover-content";
import { ReactionOptionList } from "@/components/reaction-option-list";

export function PostReactionPicker({ active, emoji, title, options }: PostReactionPickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 transition hover:bg-muted hover:text-foreground ${active ? "text-primary" : ""}`}
          title={title}
        >
          {emoji ? (
            <span className="text-base leading-none">{emoji}</span>
          ) : (
            <Heart className="h-4 w-4" />
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent align="start" side="top" className="w-fit rounded-2xl border-border p-1.5">
        <ReactionOptionList options={options} variant="post" />
      </PopoverContent>
    </Popover>
  );
}
