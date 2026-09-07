import { REACTION_EMOJIS } from "@/constants/reaction-emojis";
import { texts } from "@/texts";
import type { PostIdProps } from "@/types/components/post/post-id-props";
import { Root as Dialog } from "@radix-ui/react-dialog";

import { useReactionsDialogData } from "@/lib/use-reactions-dialog-data";

import { DialogContent } from "@/components/ui/dialog-content";
import { DialogHeader } from "@/components/ui/dialog-header";
import { DialogTitle } from "@/components/ui/dialog-title";

import { UserAvatar } from "@/components/user-avatar";

export function ReactionsDialog({ postId }: PostIdProps) {
  const { open, reactions, users, setOpen } = useReactionsDialogData(postId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
