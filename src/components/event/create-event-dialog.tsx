import { Plus } from "lucide-react";

import { texts } from "@/texts";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CreateEventForm, type CreateEventFormValues } from "./create-event-form";

type CreateEventDialogProps = {
  isOpen: boolean;
  isCreating: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onCreate: (values: CreateEventFormValues) => void;
};

export function CreateEventDialog({
  isOpen,
  isCreating,
  onOpenChange,
  onCreate,
}: CreateEventDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="rounded-full gap-1.5">
          <Plus className="h-4 w-4" /> {texts.events.createEvent}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{texts.events.createEvent}</DialogTitle>
        </DialogHeader>
        <CreateEventForm onSave={onCreate} isPending={isCreating} />
      </DialogContent>
    </Dialog>
  );
}
