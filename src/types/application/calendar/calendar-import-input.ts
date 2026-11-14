import type { CalendarScope } from "./calendar-scope";

/** Corpo do multipart do import: o arquivo é o único campo obrigatório. */
export type CalendarImportInput = {
  file: File;
  /** Agenda de destino; ausente é a consolidada no servidor (SOCIAL por padrão na criação). */
  scope?: CalendarScope | null;
};
