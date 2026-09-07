import { useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { CreateEventRequest } from "@/types/application/event/create-event-request";

import { createEvent as createEventRequest } from "@/lib/api/events/create-event";

const EVENT_FORMAT_OPTIONS = [
  { value: "ONLINE", label: texts.events.formats.ONLINE },
  { value: "IN_PERSON", label: texts.events.formats.IN_PERSON },
  { value: "HYBRID", label: texts.events.formats.HYBRID },
] as const satisfies ReadonlyArray<{ value: CreateEventRequest["format"]; label: string }>;

function createInitialForm(): CreateEventRequest {
  return {
    title: "",
    date: "",
    time: "",
    format: "ONLINE",
    host: "",
  };
}

export function useCreateEventDialogController() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CreateEventRequest>(createInitialForm);

  const createEvent = useMutation({
    mutationFn: () => createEventRequest(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setOpen(false);
      setForm(createInitialForm());
    },
  });

  const setField = <K extends keyof CreateEventRequest>(
    field: K,
    value: CreateEventRequest[K],
  ) => {
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
    createPending: createEvent.isPending,
    createDisabled:
      !form.title.trim() || !form.date || !form.host.trim() || createEvent.isPending,
    createEvent: () => createEvent.mutate(),
  };
}
