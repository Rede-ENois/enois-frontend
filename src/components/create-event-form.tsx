import { texts } from "@/texts";
import type { CreateEventFormProps } from "@/types/components/events/create-event-form-props";

import { Button } from "@/components/ui/button";

import { CreateEventFormFields } from "@/components/create-event-form-fields";
import { CreateEventFormatField } from "@/components/create-event-format-field";

export function CreateEventForm(props: CreateEventFormProps) {
  return (
    <div className="space-y-4 pt-2">
      <CreateEventFormFields form={props.form} setField={props.setField} />
      <CreateEventFormatField
        form={props.form}
        setFormat={props.setFormat}
        formatOptions={props.formatOptions}
      />

      <Button
        className="w-full rounded-full"
        disabled={props.createDisabled}
        onClick={props.createEvent}
      >
        {props.createPending ? texts.common.creating : texts.events.createEvent}
      </Button>
    </div>
  );
}
