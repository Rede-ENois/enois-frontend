/** Figurinha dentro de um set do FrankerFaceZ (`urls` tem as escalas 1, 2 e 4). */
export type FfzEmote = {
  id: number;
  name: string;
  width?: number;
  height?: number;
  hidden?: boolean;
  urls?: Record<string, string>;
};
