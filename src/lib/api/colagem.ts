import type { ColagemCommentView } from "@/types/application/colagem/colagem-comment-view";
import type { ColagemCommentsPage } from "@/types/application/colagem/colagem-comments-page";
import type { ColagemPage } from "@/types/application/colagem/colagem-page";
import type { ColagemPostView } from "@/types/application/colagem/colagem-post-view";
import type { CommentColagemPhotoInput } from "@/types/application/colagem/comment-colagem-photo-input";
import type { PublishColagemPhotoInput } from "@/types/application/colagem/publish-colagem-photo-input";

import { api, buildQuery } from "../api-client";

/**
 * Colagem: o feed fotográfico que vive no Explorar, quase um grupo de fotografias. É um espaço
 * só dele — nada daqui aparece no feed Tudo. O backend manda nas regras (uma foto por
 * publicação, resposta de foto sem foto, reação única por pessoa); a tela só traduz.
 */
export const colagemApi = {
  feed: (cursor?: string | null, limit = 24) =>
    api.get<ColagemPage>(`/colagem${buildQuery({ cursor, limit })}`),

  post: (postId: string) =>
    api.get<ColagemPostView>(`/colagem/posts/${encodeURIComponent(postId)}`),

  publish: (data: PublishColagemPhotoInput) => api.post<ColagemPostView>("/colagem/posts", data),

  removePost: (postId: string) =>
    api.delete<{ removed: boolean }>(`/colagem/posts/${encodeURIComponent(postId)}`),

  comments: (postId: string, after?: string | null, limit = 24) =>
    api.get<ColagemCommentsPage>(
      `/colagem/posts/${encodeURIComponent(postId)}/comments${buildQuery({ after, limit })}`,
    ),

  comment: (postId: string, data: CommentColagemPhotoInput) =>
    api.post<ColagemCommentView>(`/colagem/posts/${encodeURIComponent(postId)}/comments`, data),

  removeComment: (postId: string, commentId: string) =>
    api.delete<{ removed: boolean }>(
      `/colagem/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(commentId)}`,
    ),

  /** Uma reação por pessoa: reagir de novo troca o tipo; o resumo por tipo volta na resposta. */
  react: (postId: string, reaction: string) =>
    api.post<Record<string, number>>(`/colagem/posts/${encodeURIComponent(postId)}/reactions`, {
      reaction,
    }),

  unreact: (postId: string) =>
    api.delete<{ removed: boolean }>(`/colagem/posts/${encodeURIComponent(postId)}/reactions`),
};
