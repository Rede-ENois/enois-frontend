import { texts } from "@/texts";
import { Root as Dialog, Trigger as DialogTrigger } from "@radix-ui/react-dialog";

import { useCreateEventDialogController } from "@/utils/components/events/use-create-event-dialog-controller";

import { DialogContent } from "@/components/ui/dialog-content";
import { DialogHeader } from "@/components/ui/dialog-header";
import { DialogTitle } from "@/components/ui/dialog-title";

import { CreateEventForm } from "@/components/create-event-form";
import { CreateEventTrigger } from "@/components/create-event-trigger";

export function CreateEventDialog() {
  const controller = useCreateEventDialogController();

  return (
    <Dialog open={controller.open} onOpenChange={controller.setOpen}>
      <DialogTrigger asChild>
        <CreateEventTrigger />
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{texts.events.createEvent}</DialogTitle>
        </DialogHeader>

        <CreateEventForm
          form={controller.form}
          setField={controller.setField}
          setFormat={controller.setFormat}
          formatOptions={controller.formatOptions}
          createPending={controller.createPending}
          createDisabled={controller.createDisabled}
          createEvent={controller.createEvent}
        />
      </DialogContent>
    </Dialog>
  );
}
