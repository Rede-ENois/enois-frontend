import type { CommentDesabafoInput } from "@/types/application/desabafos/comment-desabafo-input";
import type { DesabafoPostView } from "@/types/application/desabafos/desabafo-post-view";
import type { DesabafosCommentView } from "@/types/application/desabafos/desabafos-comment-view";
import type { DesabafosCommentsPage } from "@/types/application/desabafos/desabafos-comments-page";
import type { DesabafosPage } from "@/types/application/desabafos/desabafos-page";
import type { PublishDesabafoInput } from "@/types/application/desabafos/publish-desabafo-input";

import { api, buildQuery } from "../api-client";

/**
 * Desabafos: o feed de texto acolhedor que vive no Explorar, quase um grupo. É um espaço só
 * dele — nada daqui aparece no feed Tudo, no perfil ou na busca. Reação é contada, nunca
 * nominada; o backend manda nas regras (só texto, uma reação por pessoa) e a tela só traduz.
 */
export const desabafosApi = {
  feed: (cursor?: string | null, limit = 24) =>
    api.get<DesabafosPage>(`/desabafos${buildQuery({ cursor, limit })}`),

  post: (postId: string) =>
    api.get<DesabafoPostView>(`/desabafos/posts/${encodeURIComponent(postId)}`),

  publish: (data: PublishDesabafoInput) => api.post<DesabafoPostView>("/desabafos/posts", data),

  removePost: (postId: string) =>
    api.delete<{ removed: boolean }>(`/desabafos/posts/${encodeURIComponent(postId)}`),

  comments: (postId: string) =>
    api.get<DesabafosCommentsPage>(`/desabafos/posts/${encodeURIComponent(postId)}/comments`),

  comment: (postId: string, data: CommentDesabafoInput) =>
    api.post<DesabafosCommentView>(`/desabafos/posts/${encodeURIComponent(postId)}/comments`, data),

  removeComment: (postId: string, commentId: string) =>
    api.delete<{ removed: boolean }>(
      `/desabafos/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(commentId)}`,
    ),

  /** Uma reação por pessoa: reagir de novo troca o tipo; o resumo por tipo volta na resposta. */
  react: (postId: string, reaction: string) =>
    api.post<Record<string, number>>(`/desabafos/posts/${encodeURIComponent(postId)}/reactions`, {
      reaction,
    }),

  unreact: (postId: string) =>
    api.delete<{ removed: boolean }>(`/desabafos/posts/${encodeURIComponent(postId)}/reactions`),
};
