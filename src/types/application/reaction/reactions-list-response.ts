export type ReactionType =
  | "LIKE"
  | "LOVE"
  | "LAUGH"
  | "WOW"
  | "SAD"
  | "CELEBRATE"
  | "SUPPORT"
  | "INSIGHTFUL";

export type ReactionItem = {
  userId: string;
  type: ReactionType;
  createdAt: string;
};

export type ReactionsListResponse = {
  postId?: string;
  summary: Record<string, number>;
  reactions: ReactionItem[];
};
