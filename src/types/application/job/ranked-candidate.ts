import type { JobApplication } from "./job-application";
import type { RecruitmentScore } from "./recruitment-score";

/** Linha da fila de triagem (`GET /jobs/{jobId}/process/candidates`), do melhor score ao pior. */
export type RankedCandidate = {
  applicationId: string;
  userId: string;
  name: string;
  status: JobApplication["status"];
  appliedAt: string | null;
  score: RecruitmentScore;
};
