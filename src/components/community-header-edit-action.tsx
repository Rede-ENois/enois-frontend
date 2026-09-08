import { useCommunityEditDialogStore } from "@/stores/community-edit-dialog.store";
import { texts } from "@/texts";
import type { CommunityHeaderEditActionProps } from "@/types/components/communities/community-header-edit-action-props";
import { Root as Dialog, Trigger as DialogTrigger } from "@radix-ui/react-dialog";
import { Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DialogContent } from "@/components/ui/dialog-content";
import { DialogHeader } from "@/components/ui/dialog-header";
import { DialogTitle } from "@/components/ui/dialog-title";

import { EditCommunityForm } from "@/components/edit-community-form";

export function CommunityHeaderEditAction({ community }: CommunityHeaderEditActionProps) {
  const open = useCommunityEditDialogStore((state) => state.open);
  const setOpen = useCommunityEditDialogStore((state) => state.setOpen);

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

        <EditCommunityForm community={community} />
      </DialogContent>
    </Dialog>
  );
}
