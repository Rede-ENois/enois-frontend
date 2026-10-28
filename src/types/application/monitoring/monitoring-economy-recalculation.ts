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
};
