import type { JobApplicationStatus } from "./job-application-status";
import type { RecruitmentScore } from "./recruitment-score";

/** One application on the board/table (`GET /jobs/{jobId}/process` e `/process/applications`). */
export type RecruitmentApplication = {
  applicationId: string;
  userId: string;
  status: JobApplicationStatus;
  appliedAt: string | null;
  stageId: string | null;
  rejected: boolean;
  lastMovementAt: string | null;
  score: RecruitmentScore | null;
};
