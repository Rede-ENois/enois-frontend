import type { ColecaoDoPost } from "@/types/application/colecoes/colecao-do-post";

/** As minhas coleções para o seletor do card — lista curta, sem paginação. */
export type MinhasColecoesPagina = {
  items: ColecaoDoPost[];
};
