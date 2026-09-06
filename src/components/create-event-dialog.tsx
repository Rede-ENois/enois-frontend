import { useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Plus } from "lucide-react";

import { eventsApi } from "@/lib/api/events";
import { texts } from "@/texts";
import type { CreateEventRequest } from "@/types/application/event/create-event-request";
import type { FieldProps } from "@/types/components/events/field-props";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function Field({ label, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

export function CreateEventDialog() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [format, setFormat] = useState<CreateEventRequest["format"]>("ONLINE");
  const [host, setHost] = useState("");

  const createEvent = useMutation({
    mutationFn: () => eventsApi.create({ title, date, time, format, host }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setOpen(false);
      setTitle("");
      setDate("");
      setTime("");
      setFormat("ONLINE");
      setHost("");
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-full gap-1.5">
          <Plus className="h-4 w-4" /><>{texts.events.createEvent}</>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{texts.events.createEvent}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <Field label={texts.events.form.title}>
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="h-10 border-transparent bg-muted"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={texts.events.form.date}>
              <Input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="h-10 border-transparent bg-muted"
              />
            </Field>
            <Field label={texts.events.form.time}>
              <Input
                type="time"
                value={time}
                onChange={(event) => setTime(event.target.value)}
                className="h-10 border-transparent bg-muted"
              />
            </Field>
          </div>
          <Field label={texts.events.form.host}>
            <Input
              value={host}
              onChange={(event) => setHost(event.target.value)}
              placeholder={texts.events.form.hostPlaceholder}
              className="h-10 border-transparent bg-muted"
            />
          </Field>
          <Field label={texts.events.form.format}>
            <select
              value={format}
              onChange={(event) => setFormat(event.target.value as CreateEventRequest["format"])}
              className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm"
            >
              <option value="ONLINE">{texts.events.formats.ONLINE}</option>
              <option value="IN_PERSON">{texts.events.formats.IN_PERSON}</option>
              <option value="HYBRID">{texts.events.formats.HYBRID}</option>
            </select>
          </Field>
          <Button
            className="w-full rounded-full"
            disabled={!title.trim() || !date || !host.trim() || createEvent.isPending}
            onClick={() => createEvent.mutate()}
          >
            {createEvent.isPending ? texts.common.creating : texts.events.createEvent}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
