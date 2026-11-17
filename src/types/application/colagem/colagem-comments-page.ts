import type { ColagemCommentView } from "@/types/application/colagem/colagem-comment-view";

/** Página de contribuições da foto, em ordem cronológica. */
export type ColagemCommentsPage = {
  items: ColagemCommentView[];
  nextCursor: string | null;
};
