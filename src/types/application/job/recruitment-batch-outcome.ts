import type { RecruitmentMovementResult } from "./recruitment-movement-result";

/** Um item da resposta do lote: movido, ou recusado com o motivo (200 não quer dizer "todas"). */
export type RecruitmentBatchOutcome = {
  applicationId: string;
  movement: RecruitmentMovementResult | null;
  errorCode: string | null;
  errorMessage: string | null;
};
