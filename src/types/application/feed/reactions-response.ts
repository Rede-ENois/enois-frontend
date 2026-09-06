import type { ReactionItem } from "../reaction/reaction-item";

export type ReactionsResponse = {
  postId: string;
  reactions: ReactionItem[];
};
