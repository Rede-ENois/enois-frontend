import type { CalendarScope } from "./calendar-scope";

/**
 * O que o import de `.ics` respondeu (fase 8, D23): o arquivo inteiro não vira agenda — parte
 * entra, parte é reagendada, parte é cancelada e parte é ignorada. Os contagens são o ponto: um
 * arquivo que não criou nada não é o mesmo de um que criou cem.
 */
export type CalendarImportResultView = {
  /** Eventos no arquivo, com data e identificação ou não. */
  received: number;
  created: number;
  moved: number;
  cancelled: number;
  skipped: number;
};
