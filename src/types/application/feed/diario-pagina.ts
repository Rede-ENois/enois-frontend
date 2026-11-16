import type { DiarioEvento } from "./diario-evento";

/** Página do diário de atividade; `nextCursor` segue o mesmo cursor de data do resto do feed. */
export type DiarioPagina = {
  itens: DiarioEvento[];
  nextCursor: string | null;
};
