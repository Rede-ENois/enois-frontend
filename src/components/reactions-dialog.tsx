import { texts } from "@/texts";
import { useReactionsDialogContext } from "@/utils/components/post/use-reactions-dialog-context";
import { Root as Dialog } from "@radix-ui/react-dialog";

import { DialogContent } from "@/components/ui/dialog-content";
import { DialogHeader } from "@/components/ui/dialog-header";
import { DialogTitle } from "@/components/ui/dialog-title";

import { ReactionsDialogList } from "@/components/reactions-dialog-list";

export function ReactionsDialog() {
  const { open, setOpen } = useReactionsDialogContext();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-light">{texts.posts.reactions.title}</DialogTitle>
        </DialogHeader>

        <ReactionsDialogList />
      </DialogContent>
    </Dialog>
  );
}
