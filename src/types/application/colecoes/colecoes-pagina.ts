import type { ColecaoResumo } from "@/types/application/colecoes/colecao-resumo";

/** Página da lista das suas coleções. */
export type ColecoesPagina = {
  items: ColecaoResumo[];
  nextCursor: string | null;
};
