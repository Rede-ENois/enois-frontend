import type { CalendarEntryKind } from "./calendar-entry-kind";
import type { CalendarScope } from "./calendar-scope";

/**
 * Corpo do `PATCH /calendar/entries/{id}`.
 *
 * Campo ausente não muda. Descrição em branco limpa o texto, porque é a única forma de dizer "tirei"
 * que não se confunde com "não mexi". Reagendar exige `startsAt` e `endsAt` juntos, e trocar o fuso
 * exige os dois também.
 *
 * `scope`, `kind` e `allDay` são editáveis: o formulário da tela mostra os três, e omiti-los fazia a
 * pessoa salvar uma mudança que o servidor descartava.
 */
export type UpdateCalendarEntryInput = {
  scope?: CalendarScope;
  kind?: CalendarEntryKind;
  title?: string;
  description?: string | null;
  startsAt?: string;
  endsAt?: string;
  timeZoneId?: string;
  allDay?: boolean;
};
