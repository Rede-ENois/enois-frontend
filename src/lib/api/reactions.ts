import type { ActionResponse } from "@/types/application/reaction/action-response";
import type { ReactionType } from "@/types/application/reaction/reaction-type";
import type { ReactionsListResponse } from "@/types/application/reaction/reactions-list-response";

import { api } from "../api-client";

export const reactionsApi = (() => {
  const postReaction = (path: string, type: ReactionType) =>
    api.post<Partial<ActionResponse>>(path, { type });
  const removeReaction = (path: string) => api.delete<Partial<ActionResponse>>(path);
  const listReactions = (path: string) => api.get<ReactionsListResponse>(path);

  return {
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
  };
})();
