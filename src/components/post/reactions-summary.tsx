import { useQuery } from "@tanstack/react-query";

import { REACTION_EMOJIS, reactionApi } from "@/lib/api";
import type { ReactionsSummaryProps } from "@/types/components/post/reactions-summary-props";

export function ReactionsSummary({ postId, currentReaction }: ReactionsSummaryProps) {
  const { data: reactionsData } = useQuery({
    queryKey: ["reactions-summary", postId],
    queryFn: () => reactionApi.listPostReactions(postId),
    staleTime: 30_000,
  });
  const entries = (
    Object.entries(reactionsData?.summary ?? {}) as [string, number][]
  ).filter(([, count]) => count > 0);
  if (entries.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-1.5">
      {entries.map(([type, count]) => (
        <span
          key={type}
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-light tabular-nums ${currentReaction === type ? "bg-surface-2 text-primary" : "border border-border-soft text-text-subtle"}`}
        >
          {REACTION_EMOJIS[type] ?? type} {count}
        </span>
      ))}
    </div>
  );
}
