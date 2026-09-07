import { usePostCardStore } from "@/stores/post-card.store";

import { createReactionsSummaryViewModel } from "@/utils/components/post/create-reactions-summary-view-model";
import { useReactionsSummary } from "@/utils/components/post/use-reactions-summary";

export function useReactionsSummaryController(postId: string) {
  const reactionStatus = usePostCardStore((state) => state.cards[postId]?.reactionStatus ?? null);
  const summary = useReactionsSummary(postId);

  return createReactionsSummaryViewModel(summary, reactionStatus);
}
