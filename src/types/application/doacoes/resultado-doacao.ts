import type { DoacaoStatus } from "./doacao-status";

/** O que a tela mostra depois de enviar o comprovante: confirmado agora ou na fila do extrato. */
export type ResultadoDoacao = {
  doacao: { id: string; status: DoacaoStatus };
  situacao: string;
};
