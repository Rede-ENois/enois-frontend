import { texts } from "@/texts";
import type { PostIdProps } from "@/types/components/post/post-id-props";
import { Root as Dialog } from "@radix-ui/react-dialog";

import { useReactionsDialogController } from "@/utils/components/post/use-reactions-dialog-controller";

import { DialogContent } from "@/components/ui/dialog-content";
import { DialogHeader } from "@/components/ui/dialog-header";
import { DialogTitle } from "@/components/ui/dialog-title";

import { UserAvatar } from "@/components/user-avatar";

export function ReactionsDialog({ postId }: PostIdProps) {
  const { open, setOpen, showEmptyState, items } = useReactionsDialogController(postId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-light">{texts.posts.reactions.title}</DialogTitle>
        </DialogHeader>
        {showEmptyState ? (
          <p className="py-8 text-center text-[13px] font-light text-text-subtle">
            {texts.posts.reactions.empty}
          </p>
        ) : (
          <div className="space-y-2 pt-2">
            {items.map((item) => (
              <div
                key={item.key}
                className="flex items-center gap-3 rounded-xl bg-surface-1 p-3"
              >
                <UserAvatar src={item.avatar} alt={item.name} className="h-9 w-9 shrink-0" />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-light text-text-strong">{item.name}</p>
                </div>

                <span className="text-xl">{item.emoji}</span>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
