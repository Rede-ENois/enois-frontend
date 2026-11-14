import type { CommentView } from "@/types/application/comment/comment-view";
import type { ReplyContext } from "@/types/application/feed/reply-context";

export type ProfileReplyView = {
  comment: CommentView;
  context: ReplyContext;
};
