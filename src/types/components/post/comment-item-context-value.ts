import type { CommentView } from "@/types/application/comment/comment-view";
import type { PostReactionOption } from "@/types/components/post/post-reaction-option";

export type CommentItemContextValue = {
  comment: CommentView;
  replyingTo?: CommentView["authorName"];
  timeLabel: string;
  showDelete: boolean;
  reply: () => void;
  remove: () => void;
  reactionLabel: string;
  reactionOptions: PostReactionOption[];
};
