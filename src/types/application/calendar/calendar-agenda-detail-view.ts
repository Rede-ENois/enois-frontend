import type { CalendarAgendaItemView } from "./calendar-agenda-item-view";
import type { CalendarParticipantView } from "./calendar-participant-view";

/**
 * Detalhe do compromisso com o lugar de quem lê.
 *
 * `participants` vem preenchido só para o organizador. Quem foi convidado recebe a lista nula: ser
 * convidado não dá o direito de ver quem mais foi.
 */
export type CalendarAgendaDetailView = CalendarAgendaItemView & {
  participants: CalendarParticipantView[] | null;
};
