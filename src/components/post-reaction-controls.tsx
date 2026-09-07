import { Root as Popover, Trigger as PopoverTrigger } from "@radix-ui/react-popover";
import { Heart } from "lucide-react";

import type { PostReactionControlsProps } from "@/types/components/post/post-reaction-controls-props";

import { PopoverContent } from "@/components/ui/popover-content";

export function PostReactionControls({
  active,
  emoji,
  title,
  options,
  count,
  onOpen,
}: PostReactionControlsProps) {
  return (
    <div className="flex">
      <Popover>
        <PopoverTrigger asChild>
          <button
            className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 transition hover:bg-muted hover:text-foreground ${
              active ? "text-primary" : ""
            }`}
            title={title}
          >
            {emoji ? (
              <span className="text-base leading-none">{emoji}</span>
            ) : (
              <Heart className="h-4 w-4" />
            )}
          </button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          side="top"
          className="w-fit rounded-2xl border-border p-1.5"
        >
          <div className="flex gap-1">
            {options.map((option) => (
              <button
                key={option.type}
                onClick={option.react}
                className={`rounded-lg px-2 py-1 text-xl transition hover:bg-muted ${
                  option.selected ? "bg-muted ring-1 ring-primary" : ""
                }`}
                title={option.title}
              >
                {option.emoji}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <button
        onClick={onOpen}
        className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs tabular-nums text-muted-foreground transition hover:bg-muted hover:text-foreground"
      >
        {count}
      </button>
    </div>
  );
}
