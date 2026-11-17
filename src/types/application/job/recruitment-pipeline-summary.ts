import type { RecruitmentApplication } from "./recruitment-application";
import type { RecruitmentBoardColumn } from "./recruitment-board-column";

/** The counters above the board. */
export type RecruitmentPipelineSummary = {
  total: number;
  inProcess: number;
  rejected: number;
};
