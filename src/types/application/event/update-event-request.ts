import type { Event } from "./event";

/** Corpo do PATCH do evento: os mesmos campos da criação, sem a recorrência (tem endpoint próprio). */
export type UpdateEventRequest = Pick<Event, "title" | "date" | "time" | "format" | "host"> &
  Partial<Pick<Event, "cover" | "streamUrl" | "location" | "city" | "state">>;
