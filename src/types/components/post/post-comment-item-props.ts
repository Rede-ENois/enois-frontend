import type { CommentView } from "@/lib/api";

export type PostCommentItemProps = {
  comment: CommentView;
  replyingTo?: string;
  currentUserId?: string;
  onDelete?: (commentId: string) => void;
  onReply?: (comment: CommentView) => void;
};
