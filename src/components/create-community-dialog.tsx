import { texts } from "@/texts";
import type { CreateCommunityDialogProps } from "@/types/components/communities/create-community-dialog-props";
import { useCreateCommunityDialogController } from "@/utils/components/communities/use-create-community-dialog-controller";
import { Root as Dialog, Trigger as DialogTrigger } from "@radix-ui/react-dialog";

import { DialogContent } from "@/components/ui/dialog-content";
import { DialogHeader } from "@/components/ui/dialog-header";
import { DialogTitle } from "@/components/ui/dialog-title";

import { CreateCommunityForm } from "@/components/create-community-form";

export function CreateCommunityDialog({ children }: CreateCommunityDialogProps) {
  const controller = useCreateCommunityDialogController();

  return (
    <Dialog open={controller.open} onOpenChange={controller.setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{texts.communities.create.title}</DialogTitle>
        </DialogHeader>

        <CreateCommunityForm onCreated={controller.close} />
      </DialogContent>
    </Dialog>
  );
}
