/**
 * O que a escrita de `/calendar/availability` manda: a semana inteira, com `id` omitido porque o
 * servidor substitui o conjunto (o que não vier deixa de existir).
 */
import type { CalendarAvailabilityWindowView } from "./calendar-availability-window-view";

export type CalendarAvailabilityWindowInput = Omit<CalendarAvailabilityWindowView, "id">;
