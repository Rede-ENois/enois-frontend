import type { DesafioParticipacaoView } from "./desafio-participacao-view";

/** As participações de um desafio (o mural inteiro, sem paginação no backend). */
export type DesafiosParticipacoesPage = {
  items: DesafioParticipacaoView[];
};
