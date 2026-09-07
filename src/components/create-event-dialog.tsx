import { texts } from "@/texts";
import { Root as Dialog, Trigger as DialogTrigger } from "@radix-ui/react-dialog";
import { Plus } from "lucide-react";

import { useCreateEventDialogController } from "@/utils/components/events/use-create-event-dialog-controller";

import { Button } from "@/components/ui/button";
import { DialogContent } from "@/components/ui/dialog-content";
import { DialogHeader } from "@/components/ui/dialog-header";
import { DialogTitle } from "@/components/ui/dialog-title";
import { Input } from "@/components/ui/input";

import { FormField } from "@/components/form-field";

export function CreateEventDialog() {
  const {
    open,
    setOpen,
    form,
    setField,
    setFormat,
    formatOptions,
    createPending,
    createDisabled,
    createEvent,
  } = useCreateEventDialogController();
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-full gap-1.5">
          <Plus className="h-4 w-4" />

          <>{texts.events.createEvent}</>
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{texts.events.createEvent}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {fieldRows.map((row) =>
            row.length === 1 ? (
              row.map(renderField)
            ) : (
              <div key={row.map((field) => field.key).join("-")} className="grid grid-cols-2 gap-3">
                {row.map(renderField)}
              </div>
            ),
          )}

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

          <Button
            className="w-full rounded-full"
            disabled={createDisabled}
            onClick={createEvent}
          >
            {createPending ? texts.common.creating : texts.events.createEvent}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
