import { REACTION_EMOJIS } from "@/constants/reaction-emojis";
import type { ActionResponse } from "@/types/application/reaction/action-response";
import type { ReactionType } from "@/types/application/reaction/reaction-type";
import type { ReactionsListResponse } from "@/types/application/reaction/reactions-list-response";

import { api } from "../api-client";

export { REACTION_EMOJIS } from "@/constants/reaction-emojis";

function postReaction(path: string, type: ReactionType) {
  return api.post<Partial<ActionResponse>>(path, { type });
}

function removeReaction(path: string) {
  return api.delete<Partial<ActionResponse>>(path);
}

function listReactions(path: string) {
  return api.get<ReactionsListResponse>(path);
}

export const reactionsApi = {
  react: (postId: string, type: ReactionType) =>
    postReaction(`/feed/posts/${postId}/reactions`, type),

  removeReaction: (postId: string) => removeReaction(`/feed/posts/${postId}/reactions`),

  listReactions: (postId: string) => listReactions(`/feed/posts/${postId}/reactions`),

  reactComment: (postId: string, commentId: string, type: ReactionType) =>
    postReaction(`/feed/posts/${postId}/comments/${commentId}/reactions`, type),

  removeCommentReaction: (postId: string, commentId: string) =>
    removeReaction(`/feed/posts/${postId}/comments/${commentId}/reactions`),

  listCommentReactions: (postId: string, commentId: string) =>
    listReactions(`/feed/posts/${postId}/comments/${commentId}/reactions`),

  save: (postId: string) => api.post<ActionResponse>(`/feed/posts/${postId}/saves`),

  removeSave: (postId: string) => api.delete<ActionResponse>(`/feed/posts/${postId}/saves`),

  share: (postId: string) => api.post<ActionResponse>(`/feed/posts/${postId}/shares`),

  /** Republica no próprio feed; `opinion` (até 600) transforma em repost com comentário. */
  repost: (postId: string, opinion?: string) =>
    api.post<unknown>(`/feed/posts/${postId}/repost`, opinion ? { opinion } : {}),

  /** Desfaz o repost puro (remove o ponteiro, não o post original). */
  undoRepost: (postId: string) => api.delete<unknown>(`/feed/posts/${postId}/repost`),
};
