import { useQuery } from "@tanstack/react-query";

import { REACTION_EMOJIS, profileApi, reactionsApi } from "@/lib/api";
import { texts } from "@/texts";
import { prependIfMissing, unique } from "@/utils/collections";

import { UserAvatar } from "@/components/user-avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function ReactionsSummary({
  postId,
  reactionStatus,
}: {
  postId: string;
  reactionStatus: string | null;
}) {
  const { data } = useQuery({
    queryKey: ["reactions-summary", postId],
    queryFn: () => reactionsApi.listReactions(postId),
    staleTime: 30_000,
  });

  const summary = data?.summary;
  if (!summary) return null;

  const entries = (Object.entries(summary) as [string, number][]).filter(([, count]) => count > 0);
  if (entries.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-1.5">
      {entries.map(([type, count]) => (
        <span
          key={type}
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-light tabular-nums ${
            reactionStatus === type
              ? "bg-surface-2 text-primary"
              : "border border-border-soft text-text-subtle"
          }`}
        >
          {REACTION_EMOJIS[type] ?? type} {count}
        </span>
      ))}
    </div>
  );
}

export function ReactionsDialog({
  postId,
  currentUserReaction,
  currentUserId,
  open,
  onOpenChange,
}: {
  postId: string;
  currentUserReaction: string | null;
  currentUserId?: string;
  open: boolean;
  onOpenChange: (value: boolean) => void;
}) {
  const { data } = useQuery({
    queryKey: ["reactions", postId],
    queryFn: () => reactionsApi.listReactions(postId),
    enabled: open,
  });

  const apiReactions = data?.reactions ?? [];
  const optimisticReaction =
    currentUserReaction && currentUserId
      ? {
          userId: currentUserId,
          type: currentUserReaction,
          createdAt: new Date().toISOString(),
        }
      : null;
  const reactions = prependIfMissing(
    apiReactions,
    optimisticReaction,
    (reaction) => reaction.userId === currentUserId,
  );
  const uniqueUserIds = unique(reactions.map((reaction) => reaction.userId));

  const { data: users } = useQuery({
    queryKey: ["profiles", "by-ids", [...uniqueUserIds].sort().join(",")],
    queryFn: async () => {
      const results = await Promise.all(
        uniqueUserIds.map((id) => profileApi.getById(id).catch(() => null)),
      );
      return Object.fromEntries(results.filter(Boolean).map((user) => [user!.id, user!]));
    },
    enabled: open && uniqueUserIds.length > 0,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
