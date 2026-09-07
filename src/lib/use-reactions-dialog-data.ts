import { useQuery } from "@tanstack/react-query";

import { usePostCardStore } from "@/stores/post-card.store";

import { getProfileById } from "@/lib/api/profile/get-profile-by-id";
import { listReactions } from "@/lib/api/reactions/list-reactions";
import { getCurrentUserId } from "@/lib/get-current-user-id";

export function useReactionsDialogData(postId: string) {
  const currentUserId = getCurrentUserId();
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
  const apiReactions = data?.reactions ?? [];
  const reactions =
    currentUserReaction &&
    currentUserId &&
    !apiReactions.some((reaction) => reaction.userId === currentUserId)
      ? [
          {
            userId: currentUserId,
            type: currentUserReaction,
            createdAt: new Date().toISOString(),
          },
          ...apiReactions,
        ]
      : apiReactions;
  const uniqueUserIds = [...new Set(reactions.map((reaction) => reaction.userId))];
  const { data: users } = useQuery({
    queryKey: ["profiles", "by-ids", [...uniqueUserIds].sort().join(",")],
    queryFn: async () => {
      const results = await Promise.all(
        uniqueUserIds.map((id) => getProfileById(id).catch(() => null)),
      );
      return Object.fromEntries(results.filter(Boolean).map((user) => [user!.id, user!]));
    },
    enabled: open && uniqueUserIds.length > 0,
  });

  return {
    open,
    reactions,
    users,
    setOpen: (nextOpen: boolean) => setShowReactions(postId, nextOpen),
  };
}
