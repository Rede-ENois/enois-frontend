import type { RecruitmentApplication } from "./recruitment-application";

/** A board column: the applications currently sitting in the stage (or the entrance). */
export type RecruitmentBoardColumn = {
  stageId: string | null;
  cards: RecruitmentApplication[];
};
