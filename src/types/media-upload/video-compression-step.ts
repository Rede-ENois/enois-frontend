/** Parâmetros de uma etapa de recodificação de vídeo no cliente. */
export type VideoCompressionStep = {
  /** Lado maior máximo da saída, em pixels. */
  maxSide: number;
  /** Bitrate de vídeo pedido ao gravador, em bits por segundo. */
  videoBitsPerSecond: number;
};
