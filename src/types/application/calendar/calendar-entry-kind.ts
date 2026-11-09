/**
 * Tipo do compromisso. O `kind` não carrega regra: ele diz onde a pessoa encontra o compromisso
 * (reunião, mentoria, entrevista), e a regra de cada um fica no módulo que o criou.
 */
export type CalendarEntryKind =
  "PERSONAL" | "EVENT" | "MENTORING" | "INTERVIEW" | "MEETING" | "CALL" | "WORKSHOP";
