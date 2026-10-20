import type { JobApplicationAnswer } from "./job-application-answer";
import type { JobApplicationStatus } from "./job-application-status";
import type { JobCandidate } from "./job-candidate";

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
};
