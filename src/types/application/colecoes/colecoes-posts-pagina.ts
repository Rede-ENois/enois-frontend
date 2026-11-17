import type { ColecaoPost } from "@/types/application/colecoes/colecao-post";

/** Página dos posts guardados numa coleção. */
export type ColecoesPostsPagina = {
  items: ColecaoPost[];
  nextCursor: string | null;
};
