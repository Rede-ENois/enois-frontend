import type { CalendarEntryKind } from "./calendar-entry-kind";
import type { CalendarScope } from "./calendar-scope";

/**
 * Corpo do `POST /calendar/entries`.
 *
 * `scope` e `kind` têm padrão no servidor (SOCIAL e PERSONAL), então quem cria um compromisso
 * pessoal não precisa mandá-los. `startsAt` e `endsAt` são instantes ISO-8601 em UTC.
 */
export type CreateCalendarEntryInput = {
  scope?: CalendarScope;
  kind?: CalendarEntryKind;
  title: string;
  description?: string | null;
  startsAt: string;
  endsAt: string;
  timeZoneId: string;
  allDay?: boolean;
};
