import type { FigurinhaOrigem } from "./figurinha-origem";

/** Uma figurinha que o índice do texto devolveu: o código, a imagem pública e a origem. */
export type FigurinhaDoIndice = {
  code: string;
  url: string;
  kind: FigurinhaOrigem;
};
