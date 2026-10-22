import type { PageResponse } from "@/types/application/api/page-response";
import type { BulkDeleteInput } from "@/types/application/feed/bulk-delete-input";
import type { BulkDeleteResult } from "@/types/application/feed/bulk-delete-result";
import type { CreatePostInput } from "@/types/application/feed/create-post-input";
import type { DeleteResult } from "@/types/application/feed/delete-result";
import type { FeedTab } from "@/types/application/feed/feed-tab";
import type { PostView } from "@/types/application/feed/post-view";
import type { ScheduledPostView } from "@/types/application/feed/scheduled-post-view";

import { api, buildQuery } from "../api-client";

export const feedApi = {
  /** Feed corporativo: só o que as identidades profissionais assinam. */
  corporate: (cursor?: string | null, limit = 20) =>
    api.get<PageResponse<PostView>>(
      `/feed/corporate${buildQuery({ cursor: cursor ?? undefined, limit })}`,
    ),

  /** Página pública de um perfil profissional: só as publicações BUSINESS daquele @. */
  corporateByUsername: (username: string, cursor?: string | null, limit = 20) =>
    api.get<PageResponse<PostView>>(
      `/corporate/${encodeURIComponent(username)}/posts${buildQuery({ cursor: cursor ?? undefined, limit })}`,
    ),

  list: (cursor?: string | null, limit = 20, tab?: FeedTab) =>
    api.get<PageResponse<PostView>>(`/feed${buildQuery({ cursor, limit, tab })}`),

  create: (data: CreatePostInput) => api.post<PostView>("/feed/posts", data),

  get: (postId: string) => api.get<PostView>(`/feed/posts/${postId}`),

  listByUser: (username: string, cursor?: string | null, limit = 20) =>
    api.get<PageResponse<PostView>>(`/users/${username}/posts${buildQuery({ cursor, limit })}`),

  listByUserId: (userId: string, cursor?: string | null, limit = 20) =>
    api.get<PageResponse<PostView>>(`/users/${userId}/posts${buildQuery({ cursor, limit })}`),

  // `pageHtml` so vai em post do tipo PAGE e `articleBody` so em ARTICLE; o backend descarta nos
  // demais tipos. Num artigo o corpo e obrigatorio tambem na edicao.
  update: (
    postId: string,
    data: {
      content: string;
      tags?: string[];
      pageHtml?: string;
      articleBody?: string;
      type?: string;
    },
  ) => api.patch<PostView>(`/feed/posts/${postId}`, data),

  /** Desfaz a exclusão do próprio post (soft delete reversível). */
  restore: (postId: string) => api.post<PostView>(`/feed/posts/${postId}/restore`),

  delete: (postId: string) => api.delete<DeleteResult>(`/feed/posts/${postId}`),

  listSaved: (cursor?: string | null, limit = 20) =>
    api.get<PageResponse<PostView>>(`/feed/saved${buildQuery({ cursor, limit })}`),

  bulkDelete: (data: BulkDeleteInput) =>
    api.post<BulkDeleteResult>("/feed/posts/bulk-delete", data),

  // --- agendamento: o post só existe no feed quando o horário chega ---

  /** Marca um post para ir ao ar sozinho na data/hora escolhida (ISO 8601, UTC). */
  schedule: (data: {
    type: string;
    content?: string;
    pageHtml?: string;
    articleBody?: string;
    tags?: string[];
    mediaIds?: string[];
    mediaSpoiler?: boolean;
    mentionedUserIds?: string[];
    communityId?: string;
    /** Assunto do post avulso (viaja com o agendado; em comunidade o post herda o dela). */
    topic?: string;
    scheduledAt: string;
  }) => api.post<ScheduledPostView>("/feed/scheduled", data),

  /** Os agendados de quem está logado, do mais próximo ao mais distante. */
  scheduled: () => api.get<ScheduledPostView[]>("/feed/scheduled"),

  cancelScheduled: (id: string) =>
    api.delete<{ id: string; status: string }>(`/feed/scheduled/${encodeURIComponent(id)}`),
};
