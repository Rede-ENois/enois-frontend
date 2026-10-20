export type CoinQuote = {
  brlCents: number;
  escala: number;
  atualizadaEm: string;
  historico: { brlCents: number; em: string }[];
};
