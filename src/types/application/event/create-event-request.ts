import type { Event } from "./event";

export type CreateEventRequest = Pick<Event, "title" | "date" | "time" | "format" | "host"> &
  Partial<Pick<Event, "cover" | "streamUrl" | "location" | "city" | "state" | "recurrence">>;
