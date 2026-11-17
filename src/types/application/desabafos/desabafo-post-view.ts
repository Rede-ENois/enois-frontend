import type { ReactionSummary } from "@/types/application/reaction/reaction-summary";

/**
 * Um desabafo como o backend devolve: texto puro e contagens, SEM autor.
 *
 * O anonimato é do contrato — o backend não manda nome, avatar nem id de autor. Quem desabafou
 * reconhece o próprio pelo `mine`, calculado no servidor a partir da sessão. Reação é contada,
 * nunca nominada: não existe lista de quem apoiou.
 */
export type DesabafoPostView = {
  id: string;
  content: string;
  createdAt: string;
  /** Total de apoios do desabafo (todas as pessoas). */
  reactions: number;
  /** Contagem por tipo; chaves só dos tipos que existem. */
  reactionSummary: ReactionSummary;
  /** Reação de quem está vendo; sem reação é null. */
  myReaction: string | null;
  comments: number;
  /** Quem vê é quem desabafou: a tela mostra o gesto de remover o próprio. */
  mine: boolean;
};
