import { useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { CreateEventRequest } from "@/types/application/event/create-event-request";

import { createEvent as createEventRequest } from "@/lib/api/events/create-event";

export function useCreateEventDialogController() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CreateEventRequest>({
    title: "",
    date: "",
    time: "",
    format: "ONLINE",
    host: "",
  });

  const createEvent = useMutation({
    mutationFn: () => createEventRequest(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setOpen(false);
      setForm({ title: "", date: "", time: "", format: "ONLINE", host: "" });
    },
  });

  const setField = <K extends keyof CreateEventRequest>(field: K, value: CreateEventRequest[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  return {
    open,
    setOpen,
    form,
    setField,
    createPending: createEvent.isPending,
    createEvent: () => createEvent.mutate(),
  };
}
