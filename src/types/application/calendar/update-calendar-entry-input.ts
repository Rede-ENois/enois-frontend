/**
 * Corpo do `PATCH /calendar/entries/{id}`.
 *
 * Campo ausente não muda. Descrição em branco limpa o texto, porque é a única forma de dizer "tirei"
 * que não se confunde com "não mexi". Reagendar exige `startsAt` e `endsAt` juntos, e trocar o fuso
 * exige os dois também.
 */
export type UpdateCalendarEntryInput = {
  title?: string;
  description?: string | null;
  startsAt?: string;
  endsAt?: string;
  timeZoneId?: string;
};
