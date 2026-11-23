import type { DoacaoResumo } from "./doacao-resumo";

export type DoacoesMinhas = {
  selo: { apoiador: boolean; confirmedCount: number; lastConfirmedAt: string };
  doacoes: DoacaoResumo[];
};
