/** Resultado do botão "Recalcular agora". */
export type MonitoringEconomyRecalculation = {
  publicada: boolean;
  cotacaoAnteriorMicros: number;
  cotacaoAtualMicros: number;
  escassez: number;
  indice: number;
  usoEscrow: number;
  usoP2p: number;
  retornoCofre: number;
  emissao: number;
  circulacao: number;
  cofre: number;
  /**
   * Fração do período diário já decorrida desde a última publicação (0 a 1). Informativo: a
   * publicação é no máximo uma por período, então clicar de novo não antecipa o passo.
   */
  periodoDecorrido: number;
  /** Depois desta chamada, uma nova chamada publicaria algo? Fora do período, não. */
  publicavelAgora: boolean;
  /** Quando a próxima reavaliação (com passo completo) acontece. */
  proximaAvaliacaoEm: string;
};
