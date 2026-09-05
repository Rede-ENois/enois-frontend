import { useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { useEventsQuery } from "@/hooks/use-feed-data";
import { eventsApi } from "@/lib/api";
import { requireAuth } from "@/lib/require-auth";
import { texts } from "@/texts";

import { AppContainer } from "@/components/app-container";
import type { CreateEventValues } from "@/components/events/create-event-form";
import { EventsGrid } from "@/components/events/events-grid";
import { EventsHeader } from "@/components/events/events-header";

export const Route = createFileRoute("/eventos")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: texts.events.seoTitle }] }),
  component: EventsRoute,
});

function EventsRoute() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const { data: eventsData } = useEventsQuery();
  const events = eventsData?.items ?? [];

  const attend = useMutation({
    mutationFn: (eventId: string) => eventsApi.attend(eventId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["events"] }),
  });

  const createEvent = useMutation({
    mutationFn: (data: CreateEventValues) => eventsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setCreateOpen(false);
    },
  });

  return (
    <AppContainer>
      <div className="space-y-6">
        <EventsHeader
          open={createOpen}
          creating={createEvent.isPending}
          onOpenChange={setCreateOpen}
          onCreate={createEvent.mutate}
        />
        <EventsGrid
          events={events}
          attending={attend.isPending}
          onAttend={attend.mutate}
        />
      </div>
    </AppContainer>
  );
}
