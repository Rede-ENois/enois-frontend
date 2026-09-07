import { REACTION_EMOJIS } from "@/constants/reaction-emojis";
import { texts } from "@/texts";
import type { ReactionType } from "@/types/application/reaction/reaction-type";

export function createCommentReactionViewModel(
  reaction: ReactionType | null,
  toggle: (type: ReactionType) => Promise<void>,
) {
  return {
    label: reaction ? REACTION_EMOJIS[reaction] : texts.posts.reactions.react,
    options: (Object.entries(REACTION_EMOJIS) as [ReactionType, string][]).map(([type, emoji]) => ({
      type,
      emoji,
      selected: reaction === type,
      react: () => toggle(type),
    })),
  };
}
