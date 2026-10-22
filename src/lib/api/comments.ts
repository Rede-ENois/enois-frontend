import type { PageResponse } from "@/types/application/api/page-response";
import type { StatusResponse } from "@/types/application/api/status-response";
import type { CommentView } from "@/types/application/comment/comment-view";
import type { EditedComment } from "@/types/application/comment/edited-comment";

import { api, buildQuery } from "../api-client";

export const commentsApi = {
  create: (
    postId: string,
    content: string,
    parentCommentId?: string | null,
    mentionedUserIds?: string[],
    mediaIds?: string[],
    website?: string,
  ) =>
    api.post<CommentView>(`/feed/posts/${postId}/comments`, {
      content,
      parentCommentId: parentCommentId ?? null,
      mediaIds: mediaIds ?? [],
      mentionedUserIds: mentionedUserIds ?? [],
      website: website ?? "",
    }),

  list: (postId: string, cursor?: string | null, limit = 20) =>
    api.get<PageResponse<CommentView>>(
      `/feed/posts/${postId}/comments${buildQuery({ cursor, limit })}`,
    ),

  /** Edicao do proprio comentario: so o autor (o backend recusa os demais). */
  update: (postId: string, commentId: string, content: string) =>
    api.patch<EditedComment>(`/feed/posts/${postId}/comments/${commentId}`, { content }),

  remove: (postId: string, commentId: string) =>
    api.delete<StatusResponse>(`/feed/posts/${postId}/comments/${commentId}`),

  /** Fixa no topo (autor do post ou do comentário). */
  pin: (postId: string, commentId: string) =>
    api.post<StatusResponse>(`/feed/posts/${postId}/comments/${commentId}/pin`),

  unpin: (postId: string, commentId: string) =>
    api.delete<StatusResponse>(`/feed/posts/${postId}/comments/${commentId}/pin`),
};
