import { useQuery } from "@tanstack/react-query";

import { profileApi, reactionsApi } from "@/lib/api";
import { prependIfMissing, unique } from "@/utils/collections";

export function useReactionsDialog({ postId, currentUserReaction, currentUserId, open }: {
  postId: string;
  currentUserReaction: string | null;
  currentUserId?: string;
  open: boolean;
}) {
  const { data } = useQuery({
    queryKey: ["reactions", postId],
    queryFn: () => reactionsApi.listReactions(postId),
    enabled: open,
  });
  const optimisticReaction = currentUserReaction && currentUserId
    ? { userId: currentUserId, type: currentUserReaction, createdAt: new Date().toISOString() }
    : null;
  const reactions = prependIfMissing(
    data?.reactions ?? [],
    optimisticReaction,
    (reaction) => reaction.userId === currentUserId,
  );
  const userIds = unique(reactions.map((reaction) => reaction.userId));
  const { data: users } = useQuery({
    queryKey: ["profiles", "by-ids", [...userIds].sort().join(",")],
    queryFn: async () => {
      const results = await Promise.all(userIds.map((id) => profileApi.getById(id).catch(() => null)));
      return Object.fromEntries(results.filter(Boolean).map((user) => [user!.id, user!]));
    },
    enabled: open && userIds.length > 0,
  });
  return { reactions, users };
}
