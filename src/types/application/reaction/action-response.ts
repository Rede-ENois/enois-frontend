export type ActionResponse = {
  postId: string;
  status: string;
  counters: {
    reactions: number;
    comments: number;
    saves: number;
    shares: number;
  };
};
