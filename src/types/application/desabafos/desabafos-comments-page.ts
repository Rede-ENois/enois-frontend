import type { DesabafosCommentView } from "@/types/application/desabafos/desabafos-comment-view";

/** As acolhidas de um desabafo, em ordem cronológica. */
export type DesabafosCommentsPage = {
  items: DesabafosCommentView[];
};
