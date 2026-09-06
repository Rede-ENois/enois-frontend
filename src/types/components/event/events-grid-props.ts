import type { Event } from "@/types/application/event/event";

export type EventsGridProps = {
  events: Event[];
  isAttending: boolean;
  onAttend: (eventId: string) => void;
};
