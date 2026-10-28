/**
 * Figurinha dentro de um set do FrankerFaceZ.
 *
 * `urls` tem as escalas estáticas (1, 2 e 4) e `animated` a mesma chave de escala apontando para a
 * versão em movimento (WebP animado) — que só existe quando o autor publicou o emote animado.
 */
export type FfzEmote = {
  id: number;
  name: string;
  width?: number;
  height?: number;
  hidden?: boolean;
  urls?: Record<string, string>;
  animated?: Record<string, string>;
};
