import { REACTION_EMOJIS } from "@/lib/api";
import { texts } from "@/texts";
import type { ReactionsDialogProps } from "@/types/components/post/reactions-dialog-props";

import { UserAvatar } from "@/components/user-avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { useReactionsDialog } from "./use-reactions-dialog";

export function ReactionsDialog({
  postId,
  currentUserReaction,
  currentUserId,
  isOpen,
  onOpenChange,
}: ReactionsDialogProps) {
  const { reactions, userById } = useReactionsDialog({
    postId,
    currentUserReaction,
    currentUserId,
    isOpen,
  });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-light">{texts.posts.reactions.title}</DialogTitle>
        </DialogHeader>
        {reactions.length === 0 ? (
          <p className="py-8 text-center text-[13px] font-light text-text-subtle">{texts.posts.reactions.empty}</p>
        ) : (
          <div className="space-y-2 pt-2">
            {reactions.map((reaction) => {
              const user = userById?.[reaction.userId];
              return (
                <div key={`${reaction.userId}-${reaction.type}`} className="flex items-center gap-3 rounded-xl bg-surface-1 p-3">
                  <UserAvatar src={user?.avatar} alt={user?.name} className="h-9 w-9 shrink-0" />
                  <p className="min-w-0 flex-1 truncate text-[13px] font-light text-text-strong">
                    {user?.name ?? texts.common.loading}
                  </p>
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
