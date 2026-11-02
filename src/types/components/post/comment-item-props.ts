import type { CommentView } from "@/types/application/comment/comment-view";

export type CommentItemProps = {
  comment: CommentView;
  replyingTo?: CommentView["authorName"];
  /** Autor do post: ele também pode fixar qualquer comentário. */
  postAuthorId: string;
  /** Recarrega a primeira página depois de fixar/desafixar. */
  onPinChanged?: () => void;
  /** Remove o comentário da lista local depois de confirmação do backend. */
  onDeleted?: (commentId: string) => void;
  /** QUESTION post only: accept/unaccept this comment as the answer (asker only). */
  acceptance?: {
    pending: boolean;
    onAccept: () => void;
    onUnaccept: () => void;
  };
};
