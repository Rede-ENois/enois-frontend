import { texts } from "@/texts";
import { useCreateEventDialogContext } from "@/utils/components/events/use-create-event-dialog-context";
import { Root as Dialog, Trigger as DialogTrigger } from "@radix-ui/react-dialog";

import { DialogContent } from "@/components/ui/dialog-content";
import { DialogHeader } from "@/components/ui/dialog-header";
import { DialogTitle } from "@/components/ui/dialog-title";

import { CreateEventForm } from "@/components/create-event-form";
import { CreateEventTrigger } from "@/components/create-event-trigger";

export function CreateEventDialog() {
  const { open, setOpen } = useCreateEventDialogContext();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <CreateEventTrigger />
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{texts.events.createEvent}</DialogTitle>
        </DialogHeader>

        <CreateEventForm />
      </DialogContent>
    </Dialog>
  );
}
