import { texts } from "@/texts";
import type { CreateEventRequest } from "@/types/application/event/create-event-request";

export const EVENT_FORMAT_OPTIONS = [
  { value: "ONLINE", label: texts.events.formats.ONLINE },
  { value: "IN_PERSON", label: texts.events.formats.IN_PERSON },
  { value: "HYBRID", label: texts.events.formats.HYBRID },
] as const satisfies ReadonlyArray<{ value: CreateEventRequest["format"]; label: string }>;
