import type { AceiteDeDocumento } from "@/types/application/documentos/aceite-de-documento";
import type { DocumentoResumo } from "@/types/application/documentos/documento-resumo";
import type { DocumentoVigente } from "@/types/application/documentos/documento-vigente";
import type { RascunhoDeDocumento } from "@/types/application/documentos/rascunho-de-documento";
import type { SituacaoDosDocumentos } from "@/types/application/documentos/situacao-dos-documentos";

import { api, buildQuery } from "@/lib/api-client";

/** Os dois documentos que hoje são versionados (o mesmo enum do backend). */
export const TIPOS_DE_DOCUMENTO = ["DIRETRIZES", "TERMOS_DE_USO"] as const;

/**
 * Documentos legais versionados: leitura pública, a situação da pessoa e o aceite.
 *
 * O aceite NÃO tem corpo: o ato é o POST no id da versão que foi mostrada à pessoa. O backend
 * recusa o aceite de versão que não está em vigor (409 DOCUMENTO_NAO_VIGENTE) e registra o texto
 * exato aceito pelo hash — não existe aceite presumido por abrir a página.
 */
export const documentosApi = {
  vigentes: () => api.get<DocumentoResumo[]>("/documentos"),

  documento: (tipo: string, versao?: number) =>
    api.get<DocumentoVigente>(`/documentos/${encodeURIComponent(tipo)}${buildQuery({ versao })}`),

  historico: (tipo: string) =>
    api.get<DocumentoResumo[]>(`/documentos/${encodeURIComponent(tipo)}/historico`),

  minhaSituacao: () => api.get<SituacaoDosDocumentos>("/documentos/me"),

  meusAceites: () => api.get<AceiteDeDocumento[]>("/documentos/me/aceites"),

  aceitar: (documentoId: string) =>
    api.post<AceiteDeDocumento>(`/documentos/${encodeURIComponent(documentoId)}/aceite`),
};

/**
 * Admin: rascunho e publicação. Criar rascunho não muda o que está em vigor; `publicar` é o que
 * põe o texto no ar e passa a pedir o aceite de quem não aceitou aquela versão.
 */
export const documentosAdminApi = {
  criarRascunho: (rascunho: { tipo: string; titulo: string; resumo: string; conteudo: string }) =>
    api.post<RascunhoDeDocumento>("/admin/documentos", rascunho),

  publicar: (documentoId: string) =>
    api.post<RascunhoDeDocumento>(`/admin/documentos/${encodeURIComponent(documentoId)}/publicar`),
};
