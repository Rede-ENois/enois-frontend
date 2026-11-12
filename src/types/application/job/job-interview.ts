import type { JobInterviewStatus } from "./job-interview-status";

/**
 * Entrevista marcada pelo empregador para uma candidatura. O horário viaja em ISO-8601 UTC e o
 * fuso de quem marcou vai junto, para a tela mostrar a mesma hora que está na agenda.
 */
export type JobInterview = {
  id: string;
  applicationId: string;
  jobId: string;
  candidateId: string;
  status: JobInterviewStatus;
  startsAt: string;
  endsAt: string;
  timeZoneId: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  cancelledAt: string | null;
};
