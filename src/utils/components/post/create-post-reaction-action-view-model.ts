import { REACTION_EMOJIS } from "@/constants/reaction-emojis";
import { texts } from "@/texts";
import type { ReactionType } from "@/types/application/reaction/reaction-type";

export function createPostReactionActionViewModel(
  reactionStatus: ReactionType | null,
  reactToPost: (type: ReactionType) => void,
) {
  const reactionEmoji = reactionStatus ? REACTION_EMOJIS[reactionStatus] : null;

  return {
    reactionActive: Boolean(reactionStatus),
    reactionEmoji,
    reactionTitle: reactionEmoji
      ? texts.posts.reactions.reactedWith(reactionEmoji)
      : texts.posts.reactions.react,
    reactionOptions: (Object.entries(REACTION_EMOJIS) as [ReactionType, string][]).map(
      ([type, emoji]) => ({
        type,
        emoji,
        selected: reactionStatus === type,
        title: type.toLowerCase(),
        react: () => reactToPost(type),
      }),
    ),
  };
}
