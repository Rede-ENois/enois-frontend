import { Settings } from "lucide-react";

import { texts } from "@/texts";
import type { CommunityHeaderActionsProps } from "@/types/components/community/community-header-actions-props";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function CommunityHeaderActions({ isAdmin, isEditOpen, editForm, membershipLabel, membershipVariant, isMembershipPending, onEditOpenChange, onMembership }: CommunityHeaderActionsProps) {
  return <div className="flex items-center gap-2">{isAdmin && <Dialog open={isEditOpen} onOpenChange={onEditOpenChange}><DialogTrigger asChild><Button variant="outline" className="rounded-full gap-1.5"><Settings className="h-4 w-4" /> {texts.communities.detail.edit}</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>{texts.communities.detail.editTitle}</DialogTitle></DialogHeader>{editForm}</DialogContent></Dialog>}<Button className="shrink-0 rounded-full" variant={membershipVariant} disabled={isMembershipPending} onClick={onMembership}>{membershipLabel}</Button></div>;
}
