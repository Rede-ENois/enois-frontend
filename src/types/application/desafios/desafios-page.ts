import type { DesafioView } from "./desafio-view";

/** Página do feed de Desafios: do mais recente ao mais antigo, cursor para a próxima. */
export type DesafiosPage = {
  items: DesafioView[];
  nextCursor: string | null;
};
