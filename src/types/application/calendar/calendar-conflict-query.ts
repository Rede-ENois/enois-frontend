import type { CalendarWindowQuery } from "./calendar-window-query";

/**
 * Consulta de conflito: a mesma janela e o mesmo `scope` da agenda, mais a entrada que está sendo
 * editada.
 *
 * `entryId` existe para a edição não acusar conflito com o próprio compromisso; na criação fica
 * ausente.
 */
export type CalendarConflictQuery = CalendarWindowQuery & {
  entryId?: string | null;
};
