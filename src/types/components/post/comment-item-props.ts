import type { CommentView } from "@/types/application/comment/comment-view";

export type CommentItemProps = {
  comment: CommentView;
  replyingTo?: CommentView["authorName"];
  /** Autor do post: ele também pode fixar qualquer comentário. */
  postAuthorId: string;
  /** Recarrega a primeira página depois de fixar/desafixar. */
  onPinChanged?: () => void;
};
