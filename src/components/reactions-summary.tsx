import { useQuery } from "@tanstack/react-query";

import { REACTION_EMOJIS } from "@/constants/reaction-emojis";
import { listReactions } from "@/lib/api/reactions/list-reactions";
import { usePostCardStore } from "@/stores/post-card.store";
import type { ReactionType } from "@/types/application/reaction/reaction-type";
import type { PostIdProps } from "@/types/components/post/post-id-props";

export function ReactionsSummary({ postId }: PostIdProps) {
  const reactionStatus = usePostCardStore((state) => state.cards[postId]?.reactionStatus ?? null);

  const { data } = useQuery({
    queryKey: ["reactions-summary", postId],
    queryFn: () => listReactions(postId),
    staleTime: 30_000,
  });

  const summary = data?.summary;
  if (!summary) return null;

  const entries = (Object.entries(summary) as [ReactionType, number][]).filter(
    ([, count]) => count > 0,
  );
  if (entries.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-1.5">
      {entries.map(([type, count]) => (
        <span
          key={type}
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-light tabular-nums ${
            reactionStatus === type
              ? "bg-surface-2 text-primary"
              : "border border-border-soft text-text-subtle"
          }`}
        >
          <>{REACTION_EMOJIS[type]} {count}</>
        </span>
      ))}
    </div>
  );
}
