import type { ReactionType } from "@/types/application/reaction/reactions-list-response";

export type ReactionActionProps = {
  currentReaction: string | null;
  onReaction: (type: ReactionType) => void;
};
