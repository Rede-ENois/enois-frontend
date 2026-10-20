import { useQuery } from "@tanstack/react-query";

import { usePostCardStore } from "@/stores/post-card.store";
import { texts } from "@/texts";
import type { PostIdProps } from "@/types/components/post/post-id-props";

import { REACTION_EMOJIS, profileApi, reactionsApi } from "@/lib/api";
import { getCurrentUserId } from "@/lib/current-user";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { UserAvatar } from "@/components/user-avatar";

/** Lista quem reagiu ao post. */
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
    currentUserReaction && currentUserId && !apiReactions.some((r) => r.userId === currentUserId)
      ? [
          { userId: currentUserId, type: currentUserReaction, createdAt: new Date().toISOString() },
          ...apiReactions,
        ]
      : apiReactions;

  const uniqueUserIds = [...new Set(reactions.map((r) => r.userId))];
  const { data: users } = useQuery({
    queryKey: ["profiles", "by-ids", uniqueUserIds.sort().join(",")],
    queryFn: async () => {
      const results = await Promise.all(
        uniqueUserIds.map((id) => profileApi.getById(id).catch(() => null)),
      );
      return Object.fromEntries(results.filter(Boolean).map((u) => [u!.id, u!]));
    },
    enabled: open && uniqueUserIds.length > 0,
  });

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => setShowReactions(postId, nextOpen)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-normal">{texts.posts.reactions.title}</DialogTitle>
        </DialogHeader>
        {reactions.length === 0 ? (
          <p className="py-8 text-center text-sm font-normal text-text-subtle">
            {texts.posts.reactions.empty}
          </p>
        ) : (
          <div className="space-y-2 pt-2">
            {reactions.map((r) => {
              const user = users?.[r.userId];
              return (
                <div
                  key={`${r.userId}-${r.type}`}
                  className="flex items-center gap-3 rounded-xl bg-surface-1 p-3"
                >
                  <UserAvatar
                    frame={user?.avatarFrame}
                    src={user?.avatar}
                    alt={user?.name}
                    className="h-9 w-9 shrink-0"
                  />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-normal text-text-strong">
                      {user?.name ?? texts.common.loading}
                    </p>
                  </div>

                  <span className="text-xl">{REACTION_EMOJIS[r.type] ?? r.type}</span>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
