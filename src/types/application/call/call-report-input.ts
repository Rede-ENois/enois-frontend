import type { ReportReason } from "@/types/application/report/report-reason";

/**
 * Denúncia de chamada. O servidor confere quem estava na sala — aqui só se diz quem foi apontado,
 * o motivo, o relato e a captura do momento (quando ela saiu).
 */
export interface CallReportInput {
  reportedUserId: string;
  reason: ReportReason;
  description: string;
  /** Id da captura já enviada ao storage; `null` quando a sala não tinha imagem legível. */
  mediaId: string | null;
}
