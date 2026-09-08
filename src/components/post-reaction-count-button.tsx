import type { PostReactionCountButtonProps } from "@/types/components/post/post-reaction-count-button-props";

export function PostReactionCountButton({ count, onOpen }: PostReactionCountButtonProps) {
  return (
    <button
      onClick={onOpen}
      className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs tabular-nums text-muted-foreground transition hover:bg-muted hover:text-foreground"
    >
      {count}
    </button>
  );
}
