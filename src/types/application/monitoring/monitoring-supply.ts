/** Supply da moeda: total fixo do gênese e como ele está distribuído. */
export type MonitoringSupply = {
  /** Total criado no gênese (em milésimos de faísca) — constante. */
  total: number;
  /** O que ainda está no cofre (tesouraria). */
  cofre: number;
  /** Total menos cofre: o que está em circulação entre as pessoas. */
  circulacao: number;
  /** Soma de todas as contas — tem que fechar com o total. */
  somaSaldos: number;
  /** Invariante: soma dos saldos igual ao total (nada criado, nada destruído). */
  coerente: boolean;
};
