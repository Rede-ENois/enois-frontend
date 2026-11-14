/**
 * Cadência de uma série de compromissos, como o backend a nomeia.
 *
 * `NONE` é o compromisso único; as outras formam uma série materializada em linhas irmãs. A série
 * nunca nasce na criação: ela é iniciada depois, por `POST /calendar/entries/{id}/series`, porque
 * antes disso não existe o compromisso fundador.
 */
export type CalendarRecurrence = "NONE" | "WEEKLY" | "BIWEEKLY" | "MONTHLY";
