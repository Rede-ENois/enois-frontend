import { useQuery } from "@tanstack/react-query";

import { REACTION_EMOJIS } from "@/constants/reaction-emojis";
import { profileApi } from "@/lib/api/profile";
import { reactionsApi } from "@/lib/api/reactions";
import { getCurrentUserId } from "@/lib/current-user";
import { usePostCardStore } from "@/stores/post-card.store";
import { texts } from "@/texts";
import type { PostIdProps } from "@/types/components/post/post-id-props";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserAvatar } from "@/components/user-avatar";

export function ReactionsDialog({ postId }: PostIdProps) {
  const currentUserId = getCurrentUserId();
  const currentUserReaction = usePostCardStore(
    (state) => state.cards[postId]?.reactionStatus ?? null,
  );
  const open = usePostCardStore((state) => state.cards[postId]?.showReactions ?? false);
  const setShowReactions = usePostCardStore((state) => state.setShowReactions);

  const { data } = useQuery({
    queryKey: ["reactions", postId],
    queryFn: () => reactionsApi.listReactions(postId),
    enabled: open,
  });

  const apiReactions = data?.reactions ?? [];
  const reactions =
    currentUserReaction && currentUserId && !apiReactions.some((reaction) => reaction.userId === currentUserId)
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
    queryKey: ["profiles", "by-ids", uniqueUserIds.sort().join(",")],
    queryFn: async () => {
      const results = await Promise.all(
        uniqueUserIds.map((id) => profileApi.getById(id).catch(() => null)),
      );
      return Object.fromEntries(results.filter(Boolean).map((user) => [user!.id, user!]));
    },
    enabled: open && uniqueUserIds.length > 0,
  });

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => setShowReactions(postId, nextOpen)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-light">{texts.posts.reactions.title}</DialogTitle>
        </DialogHeader>
        {reactions.length === 0 ? (
          <p className="py-8 text-center text-[13px] font-light text-text-subtle">
            {texts.posts.reactions.empty}
          </p>
        ) : (
          <div className="space-y-2 pt-2">
            {reactions.map((reaction) => {
              const user = users?.[reaction.userId];
              return (
                <div
                  key={`${reaction.userId}-${reaction.type}`}
                  className="flex items-center gap-3 rounded-xl bg-surface-1 p-3"
                >
                  <UserAvatar src={user?.avatar} alt={user?.name} className="h-9 w-9 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-light text-text-strong">
                      {user?.name ?? texts.common.loading}
                    </p>
                  </div>
                  <span className="text-xl">{REACTION_EMOJIS[reaction.type] ?? reaction.type}</span>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
