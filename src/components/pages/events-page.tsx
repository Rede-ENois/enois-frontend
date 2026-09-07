import { useQuery } from "@tanstack/react-query";

import { texts } from "@/texts";

import { listEvents } from "@/lib/api/events";

import { AppContainer } from "@/components/app-container";
import { CreateEventDialog } from "@/components/create-event-dialog";
import { EventCard } from "@/components/event-card";

export function Eventos() {
  const { data: eventsData } = useQuery({
    queryKey: ["events"],
    queryFn: () => listEvents(),
  });
  const events = eventsData?.items ?? [];

  return (
    <AppContainer>
      <div className="space-y-6">
        <div className="surface-card flex flex-wrap items-center justify-between gap-3 p-4 sm:gap-4 sm:p-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{texts.events.title}</h1>

            <p className="mt-1 text-sm text-muted-foreground">{texts.events.description}</p>
          </div>

          <CreateEventDialog />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </div>
    </AppContainer>
  );
}
