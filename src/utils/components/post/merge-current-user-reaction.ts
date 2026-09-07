import type { ReactionUser } from "@/types/application/feed/reaction-user";
import type { ReactionType } from "@/types/application/reaction/reaction-type";

export function mergeCurrentUserReaction(
  reactions: ReactionUser[],
  currentUserId: string | null,
  currentUserReaction: ReactionType | null,
) {
  if (
    !currentUserReaction ||
    !currentUserId ||
    reactions.some((reaction) => reaction.userId === currentUserId)
  ) {
    return reactions;
  }

  return [
    {
      userId: currentUserId,
      type: currentUserReaction,
      createdAt: new Date().toISOString(),
    },
    ...reactions,
  ];
}
