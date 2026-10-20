import { useQuery } from "@tanstack/react-query";

import { usePostCardStore } from "@/stores/post-card.store";
import type { PostIdProps } from "@/types/components/post/post-id-props";

import { REACTION_EMOJIS, reactionsApi } from "@/lib/api";

/** Resumo compacto (emoji + contagem) das reações de um post. */
export function ReactionsSummary({ postId }: PostIdProps) {
  const reactionStatus = usePostCardStore((state) => state.cards[postId]?.reactionStatus ?? null);

  const { data } = useQuery({
    queryKey: ["reactions-summary", postId],
    queryFn: () => reactionsApi.listReactions(postId),
    staleTime: 30_000,
  });

  const summary = data?.summary;
  if (!summary) return null;

  const entries = (Object.entries(summary) as [string, number][]).filter(([, count]) => count > 0);
  if (entries.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-1.5">
      {entries.map(([type, count]) => (
        <span
          key={type}
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-normal tabular-nums ${
            reactionStatus === type
              ? "bg-surface-2 text-primary"
              : "border border-border-soft text-text-subtle"
          }`}
        >
          <>
            {REACTION_EMOJIS[type as keyof typeof REACTION_EMOJIS] ?? type} {count}
          </>
        </span>
      ))}
    </div>
  );
}
