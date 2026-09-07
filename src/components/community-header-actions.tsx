import { Root as Dialog, Trigger as DialogTrigger } from "@radix-ui/react-dialog";
import { Settings } from "lucide-react";

import { texts } from "@/texts";
import type { CommunityHeaderActionsProps } from "@/types/components/communities/community-header-actions-props";

import { Button } from "@/components/ui/button";
import { DialogContent } from "@/components/ui/dialog-content";
import { DialogHeader } from "@/components/ui/dialog-header";
import { DialogTitle } from "@/components/ui/dialog-title";

import { EditCommunityForm } from "@/components/edit-community-form";

export function CommunityHeaderActions({
  community,
  isAdmin,
  editOpen,
  setEditOpen,
  closeEdit,
  membershipPending,
  membershipVariant,
  membershipLabel,
  toggleMembership,
}: CommunityHeaderActionsProps) {
  return (
    <div className="flex items-center gap-2">
      {isAdmin && (
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
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

            <EditCommunityForm community={community} onClose={closeEdit} />
          </DialogContent>
        </Dialog>
      )}

      <Button
        className="shrink-0 rounded-full"
        variant={membershipVariant}
        disabled={membershipPending}
        onClick={toggleMembership}
      >
        {membershipLabel}
      </Button>
    </div>
  );
}
