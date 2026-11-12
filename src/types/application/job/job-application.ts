import type { JobApplicationAnswer } from "./job-application-answer";
import type { JobApplicationStatus } from "./job-application-status";
import type { JobCandidate } from "./job-candidate";
import type { JobInterview } from "./job-interview";

export type JobApplication = {
  id: string;
  jobId: string;
  status: JobApplicationStatus;
  appliedAt: string;
  answersCount: number;
  candidate: JobCandidate | null;
  message: string | null;
  answers: JobApplicationAnswer[];
  feedback?: string | null;
  reviewedAt?: string | null;
  /** Entrevista marcada para esta candidatura, quando já existe uma valendo. */
  interview?: JobInterview | null;
};
