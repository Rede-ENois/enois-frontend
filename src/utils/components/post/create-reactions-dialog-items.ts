import { REACTION_EMOJIS } from "@/constants/reaction-emojis";
import { texts } from "@/texts";
import type { ReactionUser } from "@/types/application/feed/reaction-user";
import type { Profile } from "@/types/application/profile/profile";

export function createReactionsDialogItems(
  reactions: ReactionUser[],
  users: Record<string, Profile> | undefined,
) {
  return reactions.map((reaction) => {
    const user = users?.[reaction.userId];
    return {
      key: `${reaction.userId}-${reaction.type}`,
      avatar: user?.avatar,
      name: user?.name ?? texts.common.loading,
      emoji: REACTION_EMOJIS[reaction.type] ?? reaction.type,
    };
  });
}
