import { texts } from "@/texts";
import type { CreateEventFormProps } from "@/types/components/events/create-event-form-props";

import { FormField } from "@/components/form-field";

export function CreateEventFormatField({
  form,
  setFormat,
  formatOptions,
}: Pick<CreateEventFormProps, "form" | "setFormat" | "formatOptions">) {
  return (
    <FormField
      label={texts.events.form.format}
      labelClassName="text-xs font-medium text-muted-foreground"
    >
      <select
        value={form.format}
        onChange={(event) => setFormat(event.target.value)}
        className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm"
      >
        {formatOptions.map(({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </FormField>
  );
}
