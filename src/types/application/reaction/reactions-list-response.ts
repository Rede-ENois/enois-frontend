export type ReactionItem = {
  userId: string;
  type: string;
  createdAt: string;
};

export type ReactionsListResponse = {
  postId?: string;
  summary: Record<string, number>;
  reactions: ReactionItem[];
};
