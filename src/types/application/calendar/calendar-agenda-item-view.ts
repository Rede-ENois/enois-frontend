import type { CalendarEntryView } from "./calendar-entry-view";
import type { CalendarParticipation } from "./calendar-participation";

/**
 * Item da agenda: o compromisso mais o lugar de quem está lendo nele.
 *
 * `owner` é o organizador; `participation` é a resposta de quem foi convidado e vem nula para o
 * organizador, que não tem linha de participante.
 */
export type CalendarAgendaItemView = {
  entry: CalendarEntryView;
  owner: boolean;
  participation: CalendarParticipation | null;
};
