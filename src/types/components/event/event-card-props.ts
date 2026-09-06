import type { Event } from "@/types/application/event/event";

export type EventCardProps = {
  event: Event;
  isAttending: boolean;
  onAttend: (eventId: string) => void;
};
