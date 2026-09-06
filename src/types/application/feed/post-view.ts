export type PostView = {
  id: string;
  authorId: string;
  authorUsername: string;
  authorName: string;
  authorAvatar: string | null;
  type: "INSIGHT" | "ARTICLE" | "QUESTION" | "PROJECT" | "OPPORTUNITY";
  content: string;
  tags: string[];
  mediaIds: string[];
  createdAt: string;
  visibility: "PUBLIC" | "CONNECTIONS" | "MENTORS";
  counters: {
    reactions: number;
    comments: number;
    saves: number;
    shares: number;
  };
  status: "ACTIVE" | "DELETED";
  currentUserReaction?: string | null;
};
