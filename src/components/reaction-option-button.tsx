import { REACTION_OPTION_CLASS_NAMES } from "@/consts/components/post/reaction-option-class-names";
import type { ReactionOptionButtonProps } from "@/types/components/post/reaction-option-button-props";

export function ReactionOptionButton({ option, variant }: ReactionOptionButtonProps) {
  const classNames = REACTION_OPTION_CLASS_NAMES[variant];

  return (
    <button
      onClick={option.react}
      className={`rounded-lg px-2 py-1 transition ${classNames.base} ${
        option.selected ? classNames.selected : ""
      }`}
      title={option.title}
    >
      {option.emoji}
    </button>
  );
}
