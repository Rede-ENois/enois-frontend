/** Métricas do cálculo automático da cotação da faísca (painel admin). */
export type MonitoringEconomy = {
  janelaDias: number;
  /** Faíscas usadas em escrow de marketplace/serviços na janela. */
  usoEscrow: number;
  /** Faíscas transferidas entre pessoas na janela. */
  usoP2p: number;
  /** Faíscas que voltaram ao cofre (compras da loja + taxas). */
  retornoCofre: number;
  emissao: number;
  circulacao: number;
  cofre: number;
  /** Multiplicador de escassez do cofre (1× a 1× + peso). */
  escassez: number;
  indice: number;
  cotacaoAtualMicros: number;
  cotacaoSugeridaMicros: number;
  /** O período diário já fechou e o valor sugerido é diferente: clicar publica. */
  publicavelAgora: boolean;
  /** Fração do período diário já decorrida desde a última publicação (0 a 1). */
  periodoDecorrido: number;
  /** Quando o worker diário reavalia a cotação. */
  proximaAvaliacaoEm: string;
};
