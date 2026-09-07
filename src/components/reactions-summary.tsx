import type { PostIdProps } from "@/types/components/post/post-id-props";

import { useReactionsSummaryController } from "@/utils/components/post/use-reactions-summary-controller";

export function ReactionsSummary({ postId }: PostIdProps) {
  const { visible, entries } = useReactionsSummaryController(postId);

  if (!visible) return null;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-1.5">
      {entries.map((entry) => (
        <span
          key={entry.type}
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-light tabular-nums ${
            entry.selected
              ? "bg-surface-2 text-primary"
              : "border border-border-soft text-text-subtle"
          }`}
        >
          <>
            {entry.emoji} {entry.count}
          </>
        </span>
      ))}
    </div>
  );
}
