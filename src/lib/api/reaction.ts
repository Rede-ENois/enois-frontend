import { api } from "../api-client";

export const REACTION_EMOJIS: Record<string, string> = {
  LIKE: "\u{1F44D}",
  LOVE: "\u{2764}\u{FE0F}",
  LAUGH: "\u{1F602}",
  WOW: "\u{1F62E}",
  SAD: "\u{1F622}",
  CELEBRATE: "\u{1F389}",
  SUPPORT: "\u{1F4AA}",
  INSIGHTFUL: "\u{1F4A1}",
};

export type ReactionType = keyof typeof REACTION_EMOJIS;

export interface ActionResponse {
  postId: string;
  status: string;
  counters: {
    reactions: number;
    comments: number;
    saves: number;
    shares: number;
  };
}

export interface ReactionItem {
  userId: string;
  type: string;
  createdAt: string;
}

export interface ReactionsListResponse {
  postId?: string;
  summary: Record<string, number>;
  reactions: ReactionItem[];
}

function createReaction(path: string, type: ReactionType) {
  return api.post<Partial<ActionResponse>>(path, { type });
}

function removeReaction(path: string) {
  return api.delete<Partial<ActionResponse>>(path);
}

function listReactions(path: string) {
  return api.get<ReactionsListResponse>(path);
}

export const reactionApi = {
  reactToPost: (postId: string, type: ReactionType) =>
    createReaction(`/feed/posts/${postId}/reactions`, type),

  removePostReaction: (postId: string) => removeReaction(`/feed/posts/${postId}/reactions`),

  listPostReactions: (postId: string) => listReactions(`/feed/posts/${postId}/reactions`),

  reactToComment: (postId: string, commentId: string, type: ReactionType) =>
    createReaction(`/feed/posts/${postId}/comments/${commentId}/reactions`, type),

  removeCommentReaction: (postId: string, commentId: string) =>
    removeReaction(`/feed/posts/${postId}/comments/${commentId}/reactions`),

  listCommentReactions: (postId: string, commentId: string) =>
    listReactions(`/feed/posts/${postId}/comments/${commentId}/reactions`),

  savePost: (postId: string) => api.post<ActionResponse>(`/feed/posts/${postId}/saves`),

  unsavePost: (postId: string) => api.delete<ActionResponse>(`/feed/posts/${postId}/saves`),

  sharePost: (postId: string) => api.post<ActionResponse>(`/feed/posts/${postId}/shares`),
};
