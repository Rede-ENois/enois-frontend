import { Plus } from "lucide-react";

import { texts } from "@/texts";
import type { CreateEventDialogProps } from "@/types/components/event/create-event-dialog-props";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CreateEventForm } from "./create-event-form";

export function CreateEventDialog({ isOpen, isCreating, onOpenChange, onCreate }: CreateEventDialogProps) {
  return <Dialog open={isOpen} onOpenChange={onOpenChange}><DialogTrigger asChild><Button className="rounded-full gap-1.5"><Plus className="h-4 w-4" /> {texts.events.createEvent}</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>{texts.events.createEvent}</DialogTitle></DialogHeader><CreateEventForm onSave={onCreate} isPending={isCreating} /></DialogContent></Dialog>;
}
