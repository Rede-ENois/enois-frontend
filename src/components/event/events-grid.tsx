import type { Event } from "@/lib/api";

import { EventCard } from "./event-card";

type EventsGridProps = {
  events: Event[];
  isAttending: boolean;
  onAttend: (eventId: string) => void;
};

export function EventsGrid({ events, isAttending, onAttend }: EventsGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          isAttending={isAttending}
          onAttend={onAttend}
        />
      ))}
    </div>
  );
}
