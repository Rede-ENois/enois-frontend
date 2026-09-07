import type { ActionResponse } from "@/types/application/reaction/action-response";
import type { ReactionType } from "@/types/application/reaction/reaction-type";
import type { ReactionsListResponse } from "@/types/application/reaction/reactions-list-response";

import { apiRequest } from "../api-request";

export const reactionsApi = (() => {
  const postReaction = (path: string, type: ReactionType) => apiRequest<Partial<ActionResponse>>("POST", path, { type }, { idempotent: true });
  const removeReaction = (path: string) => apiRequest<Partial<ActionResponse>>("DELETE", path, null, { idempotent: true });
  const listReactions = (path: string) => apiRequest<ReactionsListResponse>("GET", path);

  return {
    react: (postId: string, type: ReactionType) => postReaction(`/feed/posts/${postId}/reactions`, type),
    removeReaction: (postId: string) => removeReaction(`/feed/posts/${postId}/reactions`),
    listReactions: (postId: string) => listReactions(`/feed/posts/${postId}/reactions`),
    reactComment: (postId: string, commentId: string, type: ReactionType) => postReaction(`/feed/posts/${postId}/comments/${commentId}/reactions`, type),
    removeCommentReaction: (postId: string, commentId: string) => removeReaction(`/feed/posts/${postId}/comments/${commentId}/reactions`),
    listCommentReactions: (postId: string, commentId: string) => listReactions(`/feed/posts/${postId}/comments/${commentId}/reactions`),
    save: (postId: string) => apiRequest<ActionResponse>("POST", `/feed/posts/${postId}/saves`, undefined, { idempotent: true }),
    removeSave: (postId: string) => apiRequest<ActionResponse>("DELETE", `/feed/posts/${postId}/saves`, null, { idempotent: true }),
    share: (postId: string) => apiRequest<ActionResponse>("POST", `/feed/posts/${postId}/shares`, undefined, { idempotent: true }),
  };
})();
