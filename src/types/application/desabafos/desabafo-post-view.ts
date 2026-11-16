import type { DesabafosAuthorView } from "@/types/application/desabafos/desabafos-author-view";
import type { ReactionSummary } from "@/types/application/reaction/reaction-summary";

/** Um desabafo como o backend devolve: texto puro e contagens — quem apoiou não vem nominado. */
export type DesabafoPostView = {
  id: string;
  author: DesabafosAuthorView;
  content: string;
  createdAt: string;
  /** Total de apoios do desabafo (todas as pessoas). */
  reactions: number;
  /** Contagem por tipo; chaves só dos tipos que existem. */
  reactionSummary: ReactionSummary;
  /** Reação de quem está vendo; sem reação é null. */
  myReaction: string | null;
  comments: number;
};
