import { useQuery } from "@tanstack/react-query";

import { usePostCardStore } from "@/stores/post-card.store";

import { listReactions } from "@/lib/api/reactions/list-reactions";
import { getCurrentUserId } from "@/lib/get-current-user-id";

import { createReactionsDialogItems } from "@/utils/components/post/create-reactions-dialog-items";
import { mergeCurrentUserReaction } from "@/utils/components/post/merge-current-user-reaction";
import { useReactionProfiles } from "@/utils/components/post/use-reaction-profiles";

export function useReactionsDialogController(postId: string) {
  const currentUserReaction = usePostCardStore(
    (state) => state.cards[postId]?.reactionStatus ?? null,
  );
  const open = usePostCardStore((state) => state.cards[postId]?.showReactions ?? false);
  const setShowReactions = usePostCardStore((state) => state.setShowReactions);
  const { data } = useQuery({
    queryKey: ["reactions", postId],
    queryFn: () => listReactions(postId),
    enabled: open,
  });
  const reactions = mergeCurrentUserReaction(
    data?.reactions ?? [],
    getCurrentUserId(),
    currentUserReaction,
  );
  const userIds = [...new Set(reactions.map((reaction) => reaction.userId))];
  const users = useReactionProfiles(userIds, open);

  return {
    open,
    setOpen: (nextOpen: boolean) => setShowReactions(postId, nextOpen),
    showEmptyState: reactions.length === 0,
    items: createReactionsDialogItems(reactions, users),
  };
}
