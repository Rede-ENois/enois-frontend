import type { ReactionType } from "@/lib/api";

export type PostReactionActionProps = {
  currentReaction: string | null;
  onReaction: (type: ReactionType) => void;
};
