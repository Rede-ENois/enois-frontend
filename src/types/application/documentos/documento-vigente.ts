import type { DocumentoResumo } from "./documento-resumo";

/** A versão com o texto, e se a pessoa já aceitou essa versão. */
export type DocumentoVigente = {
  documento: DocumentoResumo;
  conteudo: string;
  aceito: boolean;
};
