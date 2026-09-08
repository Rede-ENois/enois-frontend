import type { ReactionOptionListProps } from "@/types/components/post/reaction-option-list-props";

import { ReactionOptionButton } from "@/components/reaction-option-button";

export function ReactionOptionList({ options, variant }: ReactionOptionListProps) {
  return (
    <div className="flex gap-1">
      {options.map((option) => (
        <ReactionOptionButton key={option.type} option={option} variant={variant} />
      ))}
    </div>
  );
}
