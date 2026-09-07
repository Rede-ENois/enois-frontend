import { REACTION_EMOJIS } from "@/constants/reaction-emojis";
import type { ReactionType } from "@/types/application/reaction/reaction-type";

export function createReactionsSummaryViewModel(
  summary: Record<string, number> | undefined,
  reactionStatus: ReactionType | null,
) {
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
