import type { RecruitmentScorePart } from "./recruitment-score-part";

/** A triagem score: 0–100 plus the signals that formed it. available=false means no comparison. */
export type RecruitmentScore = {
  total: number;
  available: boolean;
  components: RecruitmentScorePart[];
};
