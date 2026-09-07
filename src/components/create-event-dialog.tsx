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
          <FormField
            label={texts.events.form.title}
            labelClassName="text-xs font-medium text-muted-foreground"
          >
            <Input
              value={form.title}
              onChange={(event) => setField("title", event.target.value)}
              className="h-10 border-transparent bg-muted"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField
              label={texts.events.form.date}
              labelClassName="text-xs font-medium text-muted-foreground"
            >
              <Input
                type="date"
                value={form.date}
                onChange={(event) => setField("date", event.target.value)}
                className="h-10 border-transparent bg-muted"
              />
            </FormField>

            <FormField
              label={texts.events.form.time}
              labelClassName="text-xs font-medium text-muted-foreground"
            >
              <Input
                type="time"
                value={form.time}
                onChange={(event) => setField("time", event.target.value)}
                className="h-10 border-transparent bg-muted"
              />
            </FormField>
          </div>

          <FormField
            label={texts.events.form.host}
            labelClassName="text-xs font-medium text-muted-foreground"
          >
            <Input
              value={form.host}
              onChange={(event) => setField("host", event.target.value)}
              placeholder={texts.events.form.hostPlaceholder}
              className="h-10 border-transparent bg-muted"
            />
          </FormField>

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
