import type { ReactionType } from "@/types/application/reaction/reaction-type";

export type PostReactionOption = {
  type: ReactionType;
  emoji: string;
  selected: boolean;
  title?: string;
  react: () => void;
};
