import type { ColagemAuthorView } from "@/types/application/colagem/colagem-author-view";
import type { ReactionSummary } from "@/types/application/reaction/reaction-summary";

/** Uma foto da Colagem como o backend devolve: a grade e o detalhe leem daqui. */
export type ColagemPostView = {
  id: string;
  author: ColagemAuthorView;
  mediaId: string;
  mediaUrl: string;
  mimeType: string;
  width: number | null;
  height: number | null;
  description: string | null;
  mediaSpoiler: boolean;
  createdAt: string;
  /** Total de reações da foto (todas as pessoas). */
  reactions: number;
  /** Contagem por tipo; chaves só dos tipos que existem. */
  reactionSummary: ReactionSummary;
  /** Reação de quem está vendo; sem reação é null. */
  myReaction: string | null;
  comments: number;
};
