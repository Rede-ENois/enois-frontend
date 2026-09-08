import { Root as Popover, Trigger as PopoverTrigger } from "@radix-ui/react-popover";

import type { CommentReactionPickerProps } from "@/types/components/post/comment-reaction-picker-props";

import { PopoverContent } from "@/components/ui/popover-content";
import { ReactionOptionList } from "@/components/reaction-option-list";

export function CommentReactionPicker({ label, options }: CommentReactionPickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="transition-colors hover:text-primary">{label}</button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        side="top"
        className="w-fit rounded-2xl border-border-soft bg-surface-card p-1.5"
      >
        <ReactionOptionList options={options} variant="comment" />
      </PopoverContent>
    </Popover>
  );
}
