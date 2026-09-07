import type { CommentView } from "@/types/application/comment/comment-view";

export type CommentItemContentProps = {
  comment: CommentView;
  replyingTo?: string;
  timeLabel: string;
};
