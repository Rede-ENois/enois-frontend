import { useQuery } from "@tanstack/react-query";

import { usePostCardStore } from "@/stores/post-card.store";

import { listReactions } from "@/lib/api/reactions/list-reactions";
import { getCurrentUserId } from "@/lib/get-current-user-id";

import { mergeCurrentUserReaction } from "@/utils/components/post/merge-current-user-reaction";
import { useReactionProfiles } from "@/utils/components/post/use-reaction-profiles";

export function useReactionsDialogData(postId: string, enabled: boolean) {
  const currentUserReaction = usePostCardStore(
    (state) => state.cards[postId]?.reactionStatus ?? null,
  );
  const { data } = useQuery({
    queryKey: ["reactions", postId],
    queryFn: () => listReactions(postId),
    enabled,
  });
  const reactions = mergeCurrentUserReaction(
    data?.reactions ?? [],
    getCurrentUserId(),
    currentUserReaction,
  );
  const userIds = [...new Set(reactions.map((reaction) => reaction.userId))];
  const users = useReactionProfiles(userIds, enabled);

  return { reactions, users };
}
