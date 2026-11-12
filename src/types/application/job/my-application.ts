import type { JobApplicationStatus } from "./job-application-status";
import type { JobInterview } from "./job-interview";

/** Candidatura como o CANDIDATO a vê: a vaga, o estado, o retorno do empregador e a entrevista. */
export type MyApplication = {
  id: string;
  jobId: string;
  jobTitle: string;
  jobCompany: string;
  status: JobApplicationStatus;
  feedback?: string | null;
  reviewedAt?: string | null;
  appliedAt: string;
  interview?: JobInterview | null;
};
