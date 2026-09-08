import { CREATE_EVENT_FIELD_ROWS } from "@/constants/create-event-field-rows";
import type { CreateEventFormProps } from "@/types/components/events/create-event-form-props";

import { Input } from "@/components/ui/input";

import { FormField } from "@/components/form-field";

export function CreateEventFormFields({
  form,
  setField,
}: Pick<CreateEventFormProps, "form" | "setField">) {
  const renderField = (field: (typeof CREATE_EVENT_FIELD_ROWS)[number][number]) => (
    <FormField
      key={field.key}
      label={field.label}
      labelClassName="text-xs font-medium text-muted-foreground"
    >
      <Input
        type={field.type}
        value={form[field.key]}
        onChange={(event) => setField(field.key, event.target.value)}
        placeholder={field.placeholder}
        className="h-10 border-transparent bg-muted"
      />
    </FormField>
  );

  return (
    <>
      {CREATE_EVENT_FIELD_ROWS.map((row) =>
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
