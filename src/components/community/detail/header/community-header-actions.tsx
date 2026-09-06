import type { ReactNode } from "react";

import { Settings } from "lucide-react";

import { texts } from "@/texts";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type CommunityHeaderActionsProps = {
  isAdmin: boolean;
  isEditOpen: boolean;
  editForm: ReactNode;
  membershipLabel: string;
  membershipVariant: "default" | "secondary";
  isMembershipPending: boolean;
  onEditOpenChange: (isOpen: boolean) => void;
  onMembership: () => void;
};

export function CommunityHeaderActions({
  isAdmin,
  isEditOpen,
  editForm,
  membershipLabel,
  membershipVariant,
  isMembershipPending,
  onEditOpenChange,
  onMembership,
}: CommunityHeaderActionsProps) {
  return (
    <div className="flex items-center gap-2">
      {isAdmin && (
        <Dialog open={isEditOpen} onOpenChange={onEditOpenChange}>
          <DialogTrigger asChild>
            <Button variant="outline" className="rounded-full gap-1.5"><Settings className="h-4 w-4" /> {texts.communities.detail.edit}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{texts.communities.detail.editTitle}</DialogTitle></DialogHeader>
            {editForm}
          </DialogContent>
        </Dialog>
      )}
      <Button
        className="shrink-0 rounded-full"
        variant={membershipVariant}
        disabled={isMembershipPending}
        onClick={onMembership}
      >
        {membershipLabel}
      </Button>
    </div>
  );
}
