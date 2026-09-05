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
import { CreateEventForm, type CreateEventValues } from "./create-event-form";

export function CreateEventDialog({
  open,
  creating,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  creating: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (values: CreateEventValues) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="rounded-full gap-1.5">
          <Plus className="h-4 w-4" /> {texts.events.createEvent}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{texts.events.createEvent}</DialogTitle>
        </DialogHeader>
        <CreateEventForm onSave={onCreate} isPending={creating} />
      </DialogContent>
    </Dialog>
  );
}
