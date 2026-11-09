import type { CalendarParticipation } from "./calendar-participation";

/**
 * Convidado como o organizador o vê. O `userId` fica de fora de propósito: a tela mostra @ e o
 * backend tira o respondente da sessão, não de um id que o cliente manda.
 */
export type CalendarParticipantView = {
  id: string;
  entryId: string;
  username: string;
  state: CalendarParticipation;
  invitedAt: string;
  respondedAt: string | null;
};
