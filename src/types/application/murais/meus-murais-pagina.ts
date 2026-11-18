import type { MuralDoPost } from "@/types/application/murais/mural-do-post";

/** Os meus murais para o seletor do card — lista curta, sem paginação. */
export type MeusMuraisPagina = {
  items: MuralDoPost[];
};
