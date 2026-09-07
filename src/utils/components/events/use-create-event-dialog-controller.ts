import { useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { EVENT_FORMAT_OPTIONS } from "@/constants/event-format-options";
import type { CreateEventRequest } from "@/types/application/event/create-event-request";

import { createEvent as createEventRequest } from "@/lib/api/events/create-event";

import { createInitialEventForm } from "@/utils/components/events/create-initial-event-form";

export function useCreateEventDialogController() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CreateEventRequest>(createInitialEventForm);

  const createEvent = useMutation({
    mutationFn: () => createEventRequest(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setOpen(false);
      setForm(createInitialEventForm());
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
