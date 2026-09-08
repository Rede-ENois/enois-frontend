import { texts } from "@/texts";
import type { CreateEventFormProps } from "@/types/components/events/create-event-form-props";

import { Input } from "@/components/ui/input";

import { FormField } from "@/components/form-field";

export function CreateEventFormFields({
  form,
  setField,
}: Pick<CreateEventFormProps, "form" | "setField">) {
  const fieldRows = [
    [
      {
        key: "title",
        label: texts.events.form.title,
        type: "text",
        value: form.title,
        placeholder: undefined,
        onChange: (value: string) => setField("title", value),
      },
    ],
    [
      {
        key: "date",
        label: texts.events.form.date,
        type: "date",
        value: form.date,
        placeholder: undefined,
        onChange: (value: string) => setField("date", value),
      },
      {
        key: "time",
        label: texts.events.form.time,
        type: "time",
        value: form.time,
        placeholder: undefined,
        onChange: (value: string) => setField("time", value),
      },
    ],
    [
      {
        key: "host",
        label: texts.events.form.host,
        type: "text",
        value: form.host,
        placeholder: texts.events.form.hostPlaceholder,
        onChange: (value: string) => setField("host", value),
      },
    ],
  ];

  const renderField = (field: (typeof fieldRows)[number][number]) => (
    <FormField
      key={field.key}
      label={field.label}
      labelClassName="text-xs font-medium text-muted-foreground"
    >
      <Input
        type={field.type}
        value={field.value}
        onChange={(event) => field.onChange(event.target.value)}
        placeholder={field.placeholder}
        className="h-10 border-transparent bg-muted"
      />
    </FormField>
  );

  return (
    <>
      {fieldRows.map((row) =>
        row.length === 1 ? (
          row.map(renderField)
        ) : (
          <div key={row.map((field) => field.key).join("-")} className="grid grid-cols-2 gap-3">
            {row.map(renderField)}
          </div>
        ),
      )}
    </>
  );
}
