import { api } from "../api-client";

/** Painel de revisão de denúncias (rota /moderacao/$reportId, acesso admin via allowlist). */
export const reportsAdminApi = {
  /** Retrato completo da denúncia: quem denunciou, quem foi denunciado e o conteúdo. */
  review: (reportId: string) =>
    api.get<{
      report: {
        id: string;
        reason: string;
        targetType: string;
        targetId: string;
        status: string;
        description?: string | null;
      };
      reporter: string;
      authorId: string;
      author: string;
      content: string;
      /** Só em denúncia de chamada: quem estava na sala, quem foi apontado e quando. */
      call?: {
        callId: string;
        reportedUserId: string;
        participants: string[];
        mediaId: string | null;
        reportedAt: string;
      } | null;
      /** A captura do momento da denúncia, quando existe. `cdnUrl` é a imagem em si. */
      media?: {
        id: string;
        fileName: string;
        mimeType: string;
        purpose: string;
        cdnUrl: string | null;
        objectKey?: string | null;
      } | null;
    }>(`/admin/reports/${reportId}`),

  penalize: (reportId: string) => api.post<string>(`/admin/reports/${reportId}/penalize`, {}),

  warn: (reportId: string) => api.post<string>(`/admin/reports/${reportId}/warn`, {}),

  /** Excluir o post denunciado (é o approve do fluxo de revisão). */
  deletePost: (reportId: string, note: string) =>
    api.post<string>(`/admin/reports/${reportId}/approve`, { note }),

  ban: (reportId: string) => api.post<string>(`/admin/reports/${reportId}/ban`, {}),

  /**
   * Denúncia de página empresarial: fecha a página (sai do diretório) sem tocar na conta do dono.
   * É a ação própria do alvo `COMPANY`; banir/penalizar o dono por causa da página é recusado.
   */
  removeCompany: (reportId: string) =>
    api.post<string>(`/admin/reports/${reportId}/remove-company`, {}),
};
