/** Disponibilidade semanal do mentor: dia da semana (1=segunda .. 7=domingo) e horários "HH:mm". */
export type AvailabilityRule = {
  dayOfWeek: number;
  times: string[];
};
