import type { LinkedinImportPreview } from "@/types/application/profile/linkedin-import-preview";
import type { ResumeApplyPrefill } from "@/types/application/profile/resume-apply-prefill";

import { ApiError, apiUrl, getSessionToken } from "../api-client";
import { clientOriginHeader } from "./client-origin";

/**
 * Importação via CURRÍCULO (PDF ou texto). Terceira origem do retrato profissional, ao lado
 * do ZIP do LinkedIn e do texto colado: a pessoa sobe o arquivo e recebe o retrato no MESMO
 * formato do LinkedIn — o front reaproveita as telas de revisão, nada é salvo automaticamente.
 */
export const resumeImportApi = {
  /**
   * Sobe o currículo e devolve o retrato para revisão antes de salvar.
   * Usa fetch direto (multipart), como o import do ZIP do LinkedIn.
   */
  importResume: async (file: File): Promise<LinkedinImportPreview> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(apiUrl("/me/import/resume"), {
      method: "POST",
      headers: { "X-Session-Token": getSessionToken() ?? "", ...clientOriginHeader() },
      body: formData,
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new ApiError(
        response.status,
        body?.code,
        resumeErrorMessage(body?.code, body?.message),
      );
    }
    return (await response.json()) as LinkedinImportPreview;
  },

  /**
   * Preenche a inscrição da vaga com os dados do currículo: sobe o arquivo + o id da vaga e
   * recebe mensagem e respostas sugeridas. Só sugere — a inscrição continua no POST existente,
   * com a pessoa revisando antes de enviar.
   */
  prefillApplication: async (jobId: string, file: File): Promise<ResumeApplyPrefill> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(apiUrl(`/me/import/resume/prefill/${jobId}`), {
      method: "POST",
      headers: { "X-Session-Token": getSessionToken() ?? "", ...clientOriginHeader() },
      body: formData,
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new ApiError(
        response.status,
        body?.code,
        resumeErrorMessage(body?.code, body?.message),
      );
    }
    return (await response.json()) as ResumeApplyPrefill;
  },
};

/**
 * Mensagem amigável por código de erro do backend (o DOC/DOCX orienta a exportar em PDF;
 * o PDF escaneado ou com senha explica o porquê).
 */
export function resumeErrorMessage(code: string | undefined, fallback?: string): string {
  switch (code) {
    case "UNSUPPORTED_FORMAT":
      return "Esse formato não entra: envie o currículo em PDF ou texto. DOC/DOCX? Exporte em PDF no seu editor (Arquivo → Exportar como PDF).";
    case "UNREADABLE_RESUME":
      return "Não encontrei texto legível nesse arquivo. Se for PDF escaneado (foto das páginas) ou protegido por senha, exporte de novo como PDF com texto.";
    case "FILE_TOO_LARGE":
      return "Arquivo grande demais: o currículo vai até 10 MB (PDF de até 20 páginas) ou 512 KB em texto.";
    case "FILE_REQUIRED":
      return "Escolha o arquivo do currículo para importar.";
    default:
      return fallback ?? "Não foi possível ler o currículo. Tente de novo.";
  }
}
