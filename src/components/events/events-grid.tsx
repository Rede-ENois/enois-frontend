import type { Event } from "@/lib/api";

import { EventCard } from "./event-card";

export function EventsGrid({
  events,
  attending,
  onAttend,
}: {
  events: Event[];
  attending: boolean;
  onAttend: (eventId: string) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => (
        <EventCard key={event.id} event={event} attending={attending} onAttend={onAttend} />
      ))}
    </div>
  );
}
