import { texts } from "@/texts";
import type { CreateEventFormProps } from "@/types/components/events/create-event-form-props";
import { useCreateEventFormController } from "@/utils/components/events/use-create-event-form-controller";

import { Button } from "@/components/ui/button";

import { CreateEventFormFields } from "@/components/create-event-form-fields";
import { CreateEventFormatField } from "@/components/create-event-format-field";

export function CreateEventForm({ onCreated }: CreateEventFormProps) {
  const controller = useCreateEventFormController(onCreated);

  return (
    <div className="space-y-4 pt-2">
      <CreateEventFormFields form={controller.form} setField={controller.setField} />
      <CreateEventFormatField
        form={controller.form}
        setFormat={controller.setFormat}
        formatOptions={controller.formatOptions}
      />

      <Button
        className="w-full rounded-full"
        disabled={controller.createDisabled}
        onClick={controller.createEvent}
      >
        {controller.createPending ? texts.common.creating : texts.events.createEvent}
      </Button>
    </div>
  );
}
