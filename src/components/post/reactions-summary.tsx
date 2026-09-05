import { useQuery } from "@tanstack/react-query";

import { REACTION_EMOJIS, reactionsApi } from "@/lib/api";

export function ReactionsSummary({ postId, reactionStatus }: { postId: string; reactionStatus: string | null }) {
  const { data } = useQuery({
    queryKey: ["reactions-summary", postId],
    queryFn: () => reactionsApi.listReactions(postId),
    staleTime: 30_000,
  });
  const entries = (Object.entries(data?.summary ?? {}) as [string, number][]).filter(([, count]) => count > 0);
  if (entries.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-1.5">
      {entries.map(([type, count]) => (
        <span
          key={type}
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-light tabular-nums ${reactionStatus === type ? "bg-surface-2 text-primary" : "border border-border-soft text-text-subtle"}`}
        >
          {REACTION_EMOJIS[type] ?? type} {count}
        </span>
      ))}
    </div>
  );
}
