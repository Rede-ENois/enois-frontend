import type { PostView, ReactionType } from "@/lib/api";

export type PostActionsProps = {
  counters: PostView["counters"];
  currentReaction: string | null;
  isSaved: boolean;
  onReaction: (type: ReactionType) => void;
  onOpenReactions: () => void;
  onToggleComments: () => void;
  onShare: () => void;
  onReport: () => void;
  onSave: () => void;
};
