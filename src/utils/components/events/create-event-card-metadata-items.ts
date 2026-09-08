import { EVENT_CARD_METADATA_ITEMS } from "@/constants/event-card-metadata-items";
import type { Event } from "@/types/application/event/event";

export function createEventCardMetadataItems(event: Event, dateTimeLabel: string) {
  const values = {
    dateTimeLabel,
    attendees: event.attendees ?? 0,
  };

  return EVENT_CARD_METADATA_ITEMS.map((item) => ({
    ...item,
    value: values[item.field],
  }));
}
