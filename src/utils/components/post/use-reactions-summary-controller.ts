import { useQuery } from "@tanstack/react-query";

import { REACTION_EMOJIS } from "@/constants/reaction-emojis";
import { usePostCardStore } from "@/stores/post-card.store";
import type { ReactionType } from "@/types/application/reaction/reaction-type";

import { listReactions } from "@/lib/api/reactions/list-reactions";

export function useReactionsSummaryController(postId: string) {
  const reactionStatus = usePostCardStore((state) => state.cards[postId]?.reactionStatus ?? null);
  const { data } = useQuery({
    queryKey: ["reactions-summary", postId],
    queryFn: () => listReactions(postId),
    staleTime: 30_000,
  });

  const summary = data?.summary;
  const entries = summary
    ? (Object.entries(summary) as [ReactionType, number][])
        .filter(([, count]) => count > 0)
        .map(([type, count]) => ({
          type,
          count,
          emoji: REACTION_EMOJIS[type],
          selected: reactionStatus === type,
        }))
    : [];

  return {
    visible: entries.length > 0,
    entries,
  };
}
