import type { ReactNode } from "react";

import { Settings } from "lucide-react";

import { texts } from "@/texts";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function CommunityHeaderActions({ isAdmin, editOpen, editForm, membershipLabel, membershipVariant, membershipPending, onEditOpenChange, onMembership }: {
  isAdmin: boolean;
  editOpen: boolean;
  editForm: ReactNode;
  membershipLabel: string;
  membershipVariant: "default" | "secondary";
  membershipPending: boolean;
  onEditOpenChange: (open: boolean) => void;
  onMembership: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      {isAdmin && (
        <Dialog open={editOpen} onOpenChange={onEditOpenChange}>
          <DialogTrigger asChild>
            <Button variant="outline" className="rounded-full gap-1.5"><Settings className="h-4 w-4" /> {texts.communities.detail.edit}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{texts.communities.detail.editTitle}</DialogTitle></DialogHeader>
            {editForm}
          </DialogContent>
        </Dialog>
      )}
      <Button className="shrink-0 rounded-full" variant={membershipVariant} disabled={membershipPending} onClick={onMembership}>
        {membershipLabel}
      </Button>
    </div>
  );
}
