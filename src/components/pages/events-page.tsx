import { texts } from "@/texts";
import { useEventsPageController } from "@/utils/components/events/use-events-page-controller";

import { AppContainer } from "@/components/app-container";
import { CreateEventDialogProvider } from "@/components/create-event-dialog-provider";
import { EventCardProvider } from "@/components/event-card-provider";

export function Eventos() {
  const { events } = useEventsPageController();

  return (
    <AppContainer>
      <div className="space-y-6">
        <div className="surface-card flex flex-wrap items-center justify-between gap-3 p-4 sm:gap-4 sm:p-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{texts.events.title}</h1>

            <p className="mt-1 text-sm text-muted-foreground">{texts.events.description}</p>
          </div>

          <CreateEventDialogProvider />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCardProvider key={event.id} event={event} />
          ))}
        </div>
      </div>
    </AppContainer>
  );
}
