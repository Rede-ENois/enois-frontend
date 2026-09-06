import type { ReactionUser } from "./reaction-user";

export type ReactionsResponse = {
  postId: string;
  reactions: ReactionUser[];
};
