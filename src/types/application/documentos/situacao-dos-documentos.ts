import type { DocumentoResumo } from "./documento-resumo";
import type { DocumentoVigente } from "./documento-vigente";

/** `GET /documentos/me`: o que está em vigor e o que a pessoa ainda precisa aceitar. */
export type SituacaoDosDocumentos = {
  documentos: DocumentoVigente[];
  pendentes: DocumentoResumo[];
};
