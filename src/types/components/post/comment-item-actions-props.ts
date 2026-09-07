import type { PostReactionOption } from "@/types/components/post/post-reaction-option";

export type CommentItemActionsProps = {
  showDelete: boolean;
  onReply: () => void;
  onRemove: () => void;
  reactionLabel: string;
  reactionOptions: PostReactionOption[];
};
