import { texts } from "@/texts";
import { useCreateEventFormContext } from "@/utils/components/events/use-create-event-form-context";

import { Button } from "@/components/ui/button";

import { CreateEventFormFields } from "@/components/create-event-form-fields";
import { CreateEventFormatField } from "@/components/create-event-format-field";

export function CreateEventForm() {
  const { createDisabled, createEvent, createPending } = useCreateEventFormContext();

  return (
    <div className="space-y-4 pt-2">
      <CreateEventFormFields />
      <CreateEventFormatField />

      <Button className="w-full rounded-full" disabled={createDisabled} onClick={createEvent}>
        {createPending ? texts.common.creating : texts.events.createEvent}
      </Button>
    </div>
  );
}
