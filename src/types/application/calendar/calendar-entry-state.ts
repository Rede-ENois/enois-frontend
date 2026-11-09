/**
 * Situação do compromisso. `CANCELLED` fica na lista em vez de sumir: o `.ics` publica o
 * cancelamento com o mesmo `UID`, e evento que some do arquivo nunca é removido da agenda de quem
 * assinou.
 */
export type CalendarEntryState = "ACTIVE" | "CANCELLED";
