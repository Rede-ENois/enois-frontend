import type { MuralContribuicao } from "@/types/application/murais/mural-contribuicao";

/** Página de publicações coladas em um mural. */
export type MuraisContribuicoesPagina = {
  items: MuralContribuicao[];
  nextCursor: string | null;
};
