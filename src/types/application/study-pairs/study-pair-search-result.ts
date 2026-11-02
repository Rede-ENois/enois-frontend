/** Objetivo aberto encontrado na busca: só o texto, sem revelar quem pediu. */
export type StudyPairSearchResult = {
  goal: string;
  topic: string | null;
  createdAt: string;
};
