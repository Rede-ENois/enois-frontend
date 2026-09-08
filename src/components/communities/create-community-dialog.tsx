import { texts } from "@/texts";
import type { CreateCommunityDialogProps } from "@/types/communities/create-community-dialog-props";
import { useCreateCommunityDialogContext } from "@/utils/communities/use-create-community-dialog-context";
import { Root as Dialog, Trigger as DialogTrigger } from "@radix-ui/react-dialog";

import { DialogContent } from "@/components/ui/dialog-content";
import { DialogHeader } from "@/components/ui/dialog-header";
import { DialogTitle } from "@/components/ui/dialog-title";

import { CreateCommunityForm } from "@/components/communities/create-community-form";

export function CreateCommunityDialog({ children }: CreateCommunityDialogProps) {
  const { open, setOpen } = useCreateCommunityDialogContext();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{texts.communities.create.title}</DialogTitle>
        </DialogHeader>

        <CreateCommunityForm />
      </DialogContent>
    </Dialog>
  );
}
