import type { ConfissaoCommentView } from "@/types/application/confessionario/confissao-comment-view";

/** Os comentários de uma confissão, em ordem cronológica. */
export type ConfessionarioCommentsPage = {
  items: ConfissaoCommentView[];
};
