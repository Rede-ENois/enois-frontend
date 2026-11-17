import type { ReactionSummary } from "@/types/application/reaction/reaction-summary";

/**
 * Uma confissão como o backend devolve: texto puro e contagens, SEM autor.
 *
 * O anonimato é do contrato — o backend não manda nome, avatar nem id de autor. Quem contou
 * reconhece a própria pelo `mine`, calculado no servidor a partir da sessão. Reação é contada,
 * nunca nominada: não existe lista de quem reagiu.
 */
export type ConfissaoPostView = {
  id: string;
  content: string;
  createdAt: string;
  /** Total de reações da história (todas as pessoas). */
  reactions: number;
  /** Contagem por tipo; chaves só dos tipos que existem. */
  reactionSummary: ReactionSummary;
  /** Reação de quem está vendo; sem reação é null. */
  myReaction: string | null;
  comments: number;
  /** Quem vê é quem contou: a tela mostra o gesto de remover a própria. */
  mine: boolean;
};
