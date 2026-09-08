import type { CommentView } from "@/types/application/comment/comment-view";

export type CommentItemProviderProps = {
  comment: CommentView;
  replyingTo?: CommentView["authorName"];
};
