export type CoinQuote = {
  /** Leitura arredondada em centavos por faísca (compatibilidade). */
  brlCents: number;
  /** Precisão real: micro-reais por faísca (1 centavo = 10.000 µ). */
  brlMicros: number;
  escala: number;
  atualizadaEm: string;
  historico: { brlCents: number; brlMicros: number; em: string }[];
};
