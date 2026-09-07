import type { CommentView } from "@/types/application/comment/comment-view";

export type PostCommentThread = {
  comment: CommentView;
  replies: {
    reply: CommentView;
    replyingTo: string | undefined;
  }[];
};
