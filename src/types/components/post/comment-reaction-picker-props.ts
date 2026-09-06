import type { ReactionType } from "@/lib/api";

export type CommentReactionPickerProps = {
  currentReaction: string | null;
  onReaction: (type: ReactionType) => void;
};
