import type { CalendarRecurrence } from "./calendar-recurrence";

/** As cadências que formam série — tudo menos `NONE`, que é a ausência de repetição. */
export type RecurringCadence = Exclude<CalendarRecurrence, "NONE">;
