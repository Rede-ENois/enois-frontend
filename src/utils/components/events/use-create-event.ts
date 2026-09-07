import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { CreateEventRequest } from "@/types/application/event/create-event-request";

import { createEvent as createEventRequest } from "@/lib/api/events/create-event";

export function useCreateEvent(form: CreateEventRequest, onCreated: () => void) {
  const queryClient = useQueryClient();
  const createEvent = useMutation({
    mutationFn: () => createEventRequest(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      onCreated();
    },
  });

  return {
    createEvent: () => createEvent.mutate(),
    createPending: createEvent.isPending,
  };
}
