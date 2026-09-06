import { useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { useEventsQuery } from "@/hooks/use-feed-queries";
import { eventApi } from "@/lib/api";
import { requireAuth } from "@/lib/require-auth";
import { texts } from "@/texts";

import { AppContainer } from "@/components/app-container";
import type { CreateEventFormValues } from "@/components/event/create-event-form";
import { EventsGrid } from "@/components/event/events-grid";
import { EventsHeader } from "@/components/event/events-header";

export const Route = createFileRoute("/eventos")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: texts.events.seoTitle }] }),
  component: EventsPage,
});

function EventsPage() {
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { data: eventsData } = useEventsQuery();
  const events = eventsData?.items ?? [];

  const attendEventMutation = useMutation({
    mutationFn: (eventId: string) => eventApi.attend(eventId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["events"] }),
  });

  const createEventMutation = useMutation({
    mutationFn: (values: CreateEventFormValues) => eventApi.create(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setIsCreateDialogOpen(false);
    },
  });

  return (
    <AppContainer>
      <div className="space-y-6">
        <EventsHeader
          isCreateDialogOpen={isCreateDialogOpen}
          isCreating={createEventMutation.isPending}
          onCreateDialogOpenChange={setIsCreateDialogOpen}
          onCreate={createEventMutation.mutate}
        />
        <EventsGrid
          events={events}
          isAttending={attendEventMutation.isPending}
          onAttend={attendEventMutation.mutate}
        />
      </div>
    </AppContainer>
  );
}
