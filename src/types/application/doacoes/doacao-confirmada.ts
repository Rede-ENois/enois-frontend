import type { DoacaoResumo } from "./doacao-resumo";

export type DoacaoConfirmada = {
  doacao: DoacaoResumo;
  situacao: string;
};
