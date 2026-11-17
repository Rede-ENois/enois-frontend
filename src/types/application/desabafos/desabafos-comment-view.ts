import type { DesabafosAuthorView } from "@/types/application/desabafos/desabafos-author-view";

/** Uma acolhida num desabafo: texto puro, resposta direta ao desabafo. */
export type DesabafosCommentView = {
  id: string;
  postId: string;
  author: DesabafosAuthorView;
  content: string;
  createdAt: string;
};
