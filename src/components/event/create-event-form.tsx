import { useState } from "react";

import { texts } from "@/texts";
import type { CreateEventFormProps } from "@/types/components/event/create-event-form-props";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EventFormField } from "./event-form-field";

export function CreateEventForm({ onSave, isPending }: CreateEventFormProps) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [format, setFormat] = useState("ONLINE");
  const [host, setHost] = useState("");

  return (
    <div className="space-y-4 pt-2">
      <EventFormField label={texts.events.form.title}>
        <Input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="h-10 border-transparent bg-muted"
        />
      </EventFormField>
      <div className="grid grid-cols-2 gap-3">
        <EventFormField label={texts.events.form.date}>
          <Input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="h-10 border-transparent bg-muted"
          />
        </EventFormField>
        <EventFormField label={texts.events.form.time}>
          <Input
            type="time"
            value={time}
            onChange={(event) => setTime(event.target.value)}
            className="h-10 border-transparent bg-muted"
          />
        </EventFormField>
      </div>
      <EventFormField label={texts.events.form.host}>
        <Input
          value={host}
          onChange={(event) => setHost(event.target.value)}
          placeholder={texts.events.form.hostPlaceholder}
          className="h-10 border-transparent bg-muted"
        />
      </EventFormField>
      <EventFormField label={texts.events.form.format}>
        <select
          value={format}
          onChange={(event) => setFormat(event.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm"
        >
          {Object.entries(texts.events.formats).map(([formatValue, label]) => (
            <option key={formatValue} value={formatValue}>
              {label}
            </option>
          ))}
        </select>
      </EventFormField>
      <Button
        className="w-full rounded-full"
        disabled={!title.trim() || !date || !host.trim() || isPending}
        onClick={() => onSave({ title, date, time, format, host })}
      >
        {isPending ? texts.common.creating : texts.events.createEvent}
      </Button>
    </div>
  );
}
