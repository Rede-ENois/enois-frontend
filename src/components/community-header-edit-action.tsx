import { texts } from "@/texts";
import { useCommunityHeaderEditActionController } from "@/utils/components/communities/use-community-header-edit-action-controller";
import { Root as Dialog, Trigger as DialogTrigger } from "@radix-ui/react-dialog";
import { Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DialogContent } from "@/components/ui/dialog-content";
import { DialogHeader } from "@/components/ui/dialog-header";
import { DialogTitle } from "@/components/ui/dialog-title";

import { EditCommunityForm } from "@/components/edit-community-form";

export function CommunityHeaderEditAction() {
  const { open, setOpen } = useCommunityHeaderEditActionController();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-full gap-1.5">
          <Settings className="h-4 w-4" />

          <>{texts.communities.detail.edit}</>
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{texts.communities.detail.editTitle}</DialogTitle>
        </DialogHeader>

        <EditCommunityForm />
      </DialogContent>
    </Dialog>
  );
}
