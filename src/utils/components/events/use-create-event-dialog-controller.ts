import { useState } from "react";

import { EVENT_FORMAT_OPTIONS } from "@/constants/event-format-options";
import type { CreateEventRequest } from "@/types/application/event/create-event-request";
import { createInitialEventForm } from "@/utils/components/events/create-initial-event-form";
import { useCreateEvent } from "@/utils/components/events/use-create-event";

export function useCreateEventDialogController() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CreateEventRequest>(createInitialEventForm);
  const create = useCreateEvent(form, () => {
    setOpen(false);
    setForm(createInitialEventForm());
  });

  const setField = <K extends keyof CreateEventRequest>(field: K, value: CreateEventRequest[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const setFormat = (value: string) => {
    const format = EVENT_FORMAT_OPTIONS.find((option) => option.value === value)?.value;
    if (format) setField("format", format);
  };

  return {
    open,
    setOpen,
    form,
    setField,
    setFormat,
    formatOptions: EVENT_FORMAT_OPTIONS,
    createPending: create.createPending,
    createDisabled: !form.title.trim() || !form.date || !form.host.trim() || create.createPending,
    createEvent: create.createEvent,
  };
}
