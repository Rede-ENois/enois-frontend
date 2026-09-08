import type { ReactionOptionButtonProps } from "@/types/components/post/reaction-option-button-props";

const variantClassNames = {
  post: "text-xl hover:bg-muted",
  comment: "text-lg hover:bg-surface-2",
};

const selectedClassNames = {
  post: "bg-muted ring-1 ring-primary",
  comment: "bg-surface-2 ring-1 ring-primary",
};

export function ReactionOptionButton({ option, variant }: ReactionOptionButtonProps) {
  return (
    <button
      onClick={option.react}
      className={`rounded-lg px-2 py-1 transition ${variantClassNames[variant]} ${
        option.selected ? selectedClassNames[variant] : ""
      }`}
      title={option.title}
    >
      {option.emoji}
    </button>
  );
}
