import type { RecruitmentApplication } from "./recruitment-application";
import type { RecruitmentBoardColumn } from "./recruitment-board-column";
import type { RecruitmentPipelineSummary } from "./recruitment-pipeline-summary";
import type { RecruitmentStage } from "./recruitment-stage";

/** O board da vaga: etapas na ordem, colunas com as candidaturas de cada uma, resumo. */
export type RecruitmentBoard = {
  stages: RecruitmentStage[];
  columns: RecruitmentBoardColumn[];
  rejected: RecruitmentApplication[];
  summary: RecruitmentPipelineSummary;
};
