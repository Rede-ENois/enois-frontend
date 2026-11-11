/** O que a tela manda ao marcar ou reagendar a entrevista. Instantes em ISO-8601 UTC. */
export type ScheduleInterviewInput = {
  startsAt: string;
  endsAt: string;
  timeZoneId: string;
  notes?: string | null;
};
