/**
 * Lugar de quem lê no compromisso. `TENTATIVE` é resposta de verdade: "talvez" não pode contar como
 * presença confirmada.
 */
export type CalendarParticipation = "INVITED" | "ACCEPTED" | "DECLINED" | "TENTATIVE";
