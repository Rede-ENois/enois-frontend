import { texts } from "@/texts";
import type { PostIdProps } from "@/types/components/post/post-id-props";
import { Root as Dialog } from "@radix-ui/react-dialog";

import { useReactionsDialogController } from "@/utils/components/post/use-reactions-dialog-controller";

import { DialogContent } from "@/components/ui/dialog-content";
import { DialogHeader } from "@/components/ui/dialog-header";
import { DialogTitle } from "@/components/ui/dialog-title";

import { ReactionsDialogList } from "@/components/reactions-dialog-list";

export function ReactionsDialog({ postId }: PostIdProps) {
  const { open, setOpen, showEmptyState, items } = useReactionsDialogController(postId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-light">{texts.posts.reactions.title}</DialogTitle>
        </DialogHeader>

        <ReactionsDialogList items={items} showEmptyState={showEmptyState} />
      </DialogContent>
    </Dialog>
  );
}
