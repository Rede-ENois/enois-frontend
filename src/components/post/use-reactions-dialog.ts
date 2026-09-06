import { useQuery } from "@tanstack/react-query";

import { profileApi, reactionApi } from "@/lib/api";
import type { UseReactionsDialogOptions } from "@/types/components/post/use-reactions-dialog-options";
import { prependIfMissing, unique } from "@/utils/collections";

export function useReactionsDialog({
  postId,
  currentUserReaction,
  currentUserId,
  isOpen,
}: UseReactionsDialogOptions) {
  const { data: reactionsData } = useQuery({
    queryKey: ["reactions", postId],
    queryFn: () => reactionApi.listPostReactions(postId),
    enabled: isOpen,
  });
  const optimisticReaction = currentUserReaction && currentUserId
    ? {
        userId: currentUserId,
        type: currentUserReaction,
        createdAt: new Date().toISOString(),
      }
    : null;
  const reactions = prependIfMissing(
    reactionsData?.reactions ?? [],
    optimisticReaction,
    (reaction) => reaction.userId === currentUserId,
  );
  const userIds = unique(reactions.map((reaction) => reaction.userId));
  const { data: userById } = useQuery({
    queryKey: ["profiles", "by-ids", [...userIds].sort().join(",")],
    queryFn: async () => {
      const profiles = await Promise.all(
        userIds.map((userId) => profileApi.getById(userId).catch(() => null)),
      );
      return Object.fromEntries(
        profiles.filter(Boolean).map((profile) => [profile!.id, profile!]),
      );
    },
    enabled: isOpen && userIds.length > 0,
  });
  return { reactions, userById };
}
