import type { CommentConfissaoInput } from "@/types/application/confessionario/comment-confissao-input";
import type { ConfessionarioCommentsPage } from "@/types/application/confessionario/confessionario-comments-page";
import type { ConfessionarioPage } from "@/types/application/confessionario/confessionario-page";
import type { ConfissaoCommentView } from "@/types/application/confessionario/confissao-comment-view";
import type { ConfissaoPostView } from "@/types/application/confessionario/confissao-post-view";
import type { PublishConfissaoInput } from "@/types/application/confessionario/publish-confissao-input";

import { api, buildQuery } from "../api-client";

/**
 * Confessionário: o espaço de histórias do Explorar — experiências, situações constrangedoras,
 * confissões. Tom de contar, diferente dos Desabafos (que acolhem o que dói). É um espaço só
 * dele — nada daqui aparece no feed Tudo, no perfil ou na busca. Reação é contada, nunca
 * nominada; o backend não manda autor nenhum e a tela só traduz.
 */
export const confessionarioApi = {
  feed: (cursor?: string | null, limit = 24) =>
    api.get<ConfessionarioPage>(`/confessionario${buildQuery({ cursor, limit })}`),

  post: (postId: string) =>
    api.get<ConfissaoPostView>(`/confessionario/posts/${encodeURIComponent(postId)}`),

  publish: (data: PublishConfissaoInput) =>
    api.post<ConfissaoPostView>("/confessionario/posts", data),

  removePost: (postId: string) =>
    api.delete<{ removed: boolean }>(`/confessionario/posts/${encodeURIComponent(postId)}`),

  comments: (postId: string) =>
    api.get<ConfessionarioCommentsPage>(
      `/confessionario/posts/${encodeURIComponent(postId)}/comments`,
    ),

  comment: (postId: string, data: CommentConfissaoInput) =>
    api.post<ConfissaoCommentView>(
      `/confessionario/posts/${encodeURIComponent(postId)}/comments`,
      data,
    ),

  removeComment: (postId: string, commentId: string) =>
    api.delete<{ removed: boolean }>(
      `/confessionario/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(commentId)}`,
    ),

  /** Uma reação por pessoa: reagir de novo troca o tipo; o resumo por tipo volta na resposta. */
  react: (postId: string, reaction: string) =>
    api.post<Record<string, number>>(
      `/confessionario/posts/${encodeURIComponent(postId)}/reactions`,
      { reaction },
    ),

  unreact: (postId: string) =>
    api.delete<{ removed: boolean }>(
      `/confessionario/posts/${encodeURIComponent(postId)}/reactions`,
    ),
};
