import type { ReactionType } from "@/lib/api";

export type ReactionActionProps = {
  currentReaction: string | null;
  onReaction: (type: ReactionType) => void;
};
