import type { MuralResumo } from "@/types/application/murais/mural-resumo";

/** Página da lista de murais do Explorar. */
export type MuraisPagina = {
  items: MuralResumo[];
  nextCursor: string | null;
};
