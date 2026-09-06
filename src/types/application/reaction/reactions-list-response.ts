import type { ReactionItem } from "./reaction-item";

export type ReactionsListResponse = {
  postId?: string;
  summary: Record<string, number>;
  reactions: ReactionItem[];
};
