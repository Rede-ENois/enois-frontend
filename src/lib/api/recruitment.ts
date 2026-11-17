import type { PageResponse } from "@/types/application/api/page-response";
import type { JobApplicationStatus } from "@/types/application/job/job-application-status";
import type { RankedCandidate } from "@/types/application/job/ranked-candidate";
import type { RecruitmentApplication } from "@/types/application/job/recruitment-application";
import type { RecruitmentBatchOutcome } from "@/types/application/job/recruitment-batch-outcome";
import type { RecruitmentBoard } from "@/types/application/job/recruitment-board";
import type { RecruitmentMovementKind } from "@/types/application/job/recruitment-movement-kind";
import type { RecruitmentMovementResult } from "@/types/application/job/recruitment-movement-result";

import { api, buildQuery } from "../api-client";

/**
 * O processo seletivo da vaga, pelo lado do recrutador: board, tabela paginada, fila de triagem
 * e movimentos (inclusive em lote). Autorização toda no backend — estas rotas só refletem o que
 * `SelectionProcessController` e `ApplicationBoardPageController` publicam.
 */
export const recruitmentApi = {
  board: (jobId: string) => api.get<RecruitmentBoard>(`/jobs/${jobId}/process`),

  page: (
    jobId: string,
    params: {
      cursor?: string | null;
      limit?: number;
      status?: JobApplicationStatus | null;
      search?: string | null;
    } = {},
  ) =>
    api.get<PageResponse<RecruitmentApplication>>(
      `/jobs/${jobId}/process/applications${buildQuery({
        cursor: params.cursor ?? undefined,
        limit: params.limit ?? 30,
        status: params.status ?? undefined,
        search: params.search?.trim() || undefined,
      })}`,
    ),

  ranked: (jobId: string, limit = 100) =>
    api.get<RankedCandidate[]>(`/jobs/${jobId}/process/candidates${buildQuery({ limit })}`),

  move: (
    jobId: string,
    applicationId: string,
    stageId: string | null,
    kind: RecruitmentMovementKind,
    note?: string,
  ) =>
    api.post<RecruitmentMovementResult>(
      `/jobs/${jobId}/process/applications/${applicationId}/move`,
      { stageId, kind, note: note?.trim() || undefined },
    ),

  batchMove: (
    jobId: string,
    applicationIds: string[],
    stageId: string | null,
    kind: RecruitmentMovementKind,
    note?: string,
  ) =>
    api.post<RecruitmentBatchOutcome[]>(`/jobs/${jobId}/process/applications/batch-move`, {
      applicationIds,
      stageId,
      kind,
      note: note?.trim() || undefined,
    }),
};
